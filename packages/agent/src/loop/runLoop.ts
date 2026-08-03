import { exec } from "child_process";
import { promisify } from "util";

import { AgentState } from "../../types/AgentState";
import { chooseTool } from "../model";
import { ToolCall } from "../../types/ToolCall";
import { createPlan } from "../planner";
import { callTool } from "../client";
import { logTrajectory } from "../logger";
import { brokenRepoRoot } from "../paths";
import {
  aggregateMetrics,
  printMetrics,
  RunResult,
} from "../metrics/metrics";

const execAsync = promisify(exec);

// Maximum runtime: 30 seconds
const MAX_RUNTIME_MS = 30_000;

export async function runLoop(
  state: AgentState
) {
  const repoPath = brokenRepoRoot;

  const startTime = Date.now();

  let toolErrors = 0;
  let repeatedSteps = 0;
  let guardrailViolations = 0;

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

  // Initial test run
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
    // =========================
    // Wall Clock Budget
    // =========================

    if (
      Date.now() - startTime >
      MAX_RUNTIME_MS
    ) {
      console.log();

      console.log(
        "================================="
      );

      console.log(
        "TIME BUDGET EXHAUSTED"
      );

      console.log(
        "================================="
      );

      console.log(
        `Agent exceeded ${
          MAX_RUNTIME_MS / 1000
        } seconds.`
      );

      break;
    }

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
        tool.function
          .arguments || "{}"
      ),
    };

    console.log("Chosen Tool:");
    console.log(toolCall);

    const response =
      await callTool(
        toolCall.name,
        toolCall.arguments
      );

    const result = {
      id: toolCall.id,
      ok: !response.isError,
      output: JSON.stringify(
        response,
        null,
        2
      ),
    };

    if (!result.ok) {
      toolErrors++;

      if (
        toolCall.name ===
        "propose_edit"
      ) {
        guardrailViolations++;
      }
    }

    console.log("\nTool Result:");
    console.log(result);

    // Cache read files

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

    // Cache directories

    if (
      toolCall.name ===
      "list_dir"
    ) {
      const dir = String(
        toolCall.arguments
          .path ?? ""
      );

      if (
        state.seenDirectories.includes(
          dir
        )
      ) {
        repeatedSteps++;
      } else {
        state.seenDirectories.push(
          dir
        );
      }
    }

    // Save history

    state.history.push({
      call: toolCall,
      result,
      timestamp:
        new Date().toISOString(),
    });

    // Log trajectory

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

    // ==========================
    // Stuck Loop Detection
    // ==========================

    if (
      state.history.length >= 3
    ) {
      const lastThree =
        state.history.slice(-3);

      const repeated =
        lastThree.every(
          (item) =>
            item.call.name ===
              toolCall.name &&
            JSON.stringify(
              item.call.arguments
            ) ===
              JSON.stringify(
                toolCall.arguments
              )
        );

      if (repeated) {
        console.log();

        console.log(
          "================================="
        );

        console.log(
          "STUCK LOOP DETECTED"
        );

        console.log(
          "================================="
        );

        console.log(
          "The same tool with identical arguments was selected three consecutive times."
        );

        break;
      }
    }

    // Run tests

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

  // Step Budget

  if (
    !state.completed &&
    state.currentStep >=
      state.maxSteps
  ) {
    console.log();

    console.log(
      "================================="
    );

    console.log(
      "STEP BUDGET EXHAUSTED"
    );

    console.log(
      "================================="
    );

    console.log(
      `Maximum step budget (${state.maxSteps}) reached.`
    );
  }

  // ==========================
  // Metrics
  // ==========================

  const runResult: RunResult = {
    success: state.completed,
    steps: state.currentStep,
    maxSteps: state.maxSteps,
    wastedSteps: repeatedSteps,
    toolErrors,
    guardrailViolations,
    durationMs: Date.now() - startTime,
  };

  printMetrics(aggregateMetrics([runResult]), runResult);

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

  return { state };
}