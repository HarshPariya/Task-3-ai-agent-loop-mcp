import { exec } from "child_process";
import { promisify } from "util";

import { AgentState } from "../types/AgentState";
import { chooseTool } from "./model";
import { executeTool } from "./toolDispatcher";
import { ToolCall } from "../types/ToolCall";
import { createPlan } from "./planner";
import { logTrajectory } from "./logger";
import { brokenRepoRoot } from "./paths";

const execAsync = promisify(exec);

function isSameToolCall(
  a: ToolCall,
  b: ToolCall
): boolean {
  return (
    a.name === b.name &&
    JSON.stringify(a.arguments) ===
      JSON.stringify(b.arguments)
  );
}

export async function runLoop(
  state: AgentState
) {
  const repoPath = brokenRepoRoot;

  async function runTests() {
    try {
      const { stdout, stderr } =
        await execAsync("pnpm test", {
          cwd: repoPath,
        });

      state.currentTestOutput =
        stdout + stderr;

      return true;
    } catch (error: any) {
      state.currentTestOutput =
        (error.stdout ?? "") +
        (error.stderr ?? "");

      return false;
    }
  }

  const passed = await runTests();

  if (passed) {
    console.log("✅ Tests Passed");
    state.completed = true;
  } else {
    state.plan =
      await createPlan(state);

    console.log(
      "\n=========================="
    );

    console.log("PLAN");

    console.log(
      "=========================="
    );

    state.plan.forEach(
      (step, index) => {
        console.log(
          `${index + 1}. ${step}`
        );
      }
    );

    console.log();
  }

  while (
    !state.completed &&
    state.currentStep <
      state.maxSteps
  ) {
    console.log(
      `\n========== STEP ${
        state.currentStep + 1
      } ==========\n`
    );

    const tool =
      await chooseTool(state);

    if (!tool) {
      console.log(
        "No tool selected."
      );
      break;
    }

    const toolCall: ToolCall = {
      id: tool.id,
      name:
        tool.function
          .name as ToolCall["name"],
      arguments: JSON.parse(
        tool.function.arguments ||
          "{}"
      ),
    };

    if (
      state.history.length >= 2
    ) {
      const last =
        state.history[
          state.history.length - 1
        ].call;

      const secondLast =
        state.history[
          state.history.length - 2
        ].call;

      if (
        isSameToolCall(
          toolCall,
          last
        ) &&
        isSameToolCall(
          toolCall,
          secondLast
        )
      ) {
        console.log(
          "\n❌ Stuck Loop Detected"
        );
        console.log(
          "Aborting run."
        );

        state.completed = true;
        break;
      }
    }

    console.log("Chosen Tool:");
    console.log(toolCall);

    const result =
      await executeTool(
        toolCall
      );

    console.log(
      "\nTool Result:"
    );
    console.log(result);

    if (
      toolCall.name ===
        "read_file" &&
      result.ok
    ) {
      const file = String(
        toolCall.arguments.path
      );

      if (
        !state.seenFiles.includes(
          file
        )
      ) {
        state.seenFiles.push(file);
      }

      state.fileContents[file] =
        result.output;
    }

    if (
      toolCall.name ===
      "list_dir"
    ) {
      const dir = String(
        toolCall.arguments
          .path ?? ""
      );

      if (
        !state.seenDirectories.includes(
          dir
        )
      ) {
        state.seenDirectories.push(
          dir
        );
      }
    }

    state.history.push({
      call: toolCall,
      result,
      timestamp:
        new Date().toISOString(),
    });

    // -------------------------
    // JSONL Trajectory Logging
    // -------------------------

    await logTrajectory({
      step:
        state.currentStep + 1,
      tool: toolCall.name,
      arguments:
        toolCall.arguments,
      result: result.output,
      timestamp:
        new Date().toISOString(),
    });

    if (
      toolCall.name ===
        "propose_edit" &&
      result.ok
    ) {
      const file = String(toolCall.arguments.path);
      const content = String(toolCall.arguments.content);

      if (!state.seenFiles.includes(file)) {
        state.seenFiles.push(file);
      }

      state.fileContents[file] = content;
    }

    if (
      toolCall.name ===
      "run_test"
    ) {
      const passed =
        await runTests();

      if (passed) {
        console.log(
          "\n✅ Tests Passed"
        );

        state.completed = true;
      } else {
        console.log(
          "\n❌ Tests Still Failing"
        );
      }
    }

    state.currentStep++;
  }

  console.log(
    "\n=========================="
  );

  console.log(
    "FINAL STATE"
  );

  console.log(
    "=========================="
  );

  console.log(state);
}