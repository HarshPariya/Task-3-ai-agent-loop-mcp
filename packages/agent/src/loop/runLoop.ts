import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import readline from "readline";

import { AgentState } from "../../types/AgentState";
import { chooseTool } from "../model";
import { ToolCall } from "../../types/ToolCall";
import { createPlan } from "../planner";
import { callTool } from "../client";
import { logTrajectory } from "../logger";
import { brokenRepoRoot } from "../paths";
import { validateEditPath } from "../approval/validateEdit";
import { isStuckLoop } from "./stuckLoop";
import { saveRunHistory } from "../tracing/history";
import { generateReport } from "../report/report";
import { generateTraceViewer } from "../viewer/viewer";
import {
  aggregateMetrics,
  printMetrics,
  RunResult,
} from "../metrics/metrics";
import { Tracer } from "../tracing/tracer";
import { BudgetManager } from "../budget/budget";
import { HumanApprovalPolicy, ActionCategory } from "../policy/policy";

const execAsync = promisify(exec);

// Maximum runtime: 180 seconds (3 minutes)
const MAX_RUNTIME_MS = 180_000;

async function askUserApproval(
  filePath: string,
  content: string
): Promise<boolean> {
  if (process.env.AUTO_APPLY === "true") {
    console.log("Auto-applying edit (AUTO_APPLY=true)\n");
    return true;
  }

  console.log("\n=================================");
  console.log("PROPOSED EDIT");
  console.log("=================================\n");
  console.log("File:", filePath);
  console.log("\nNew Content:\n");
  console.log(content);
  console.log("\n=================================\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answer: string = await new Promise((resolve) => {
    rl.question("Apply this edit? (y/n): ", resolve);
  });

  rl.close();
  return answer.toLowerCase() === "y";
}

export async function runLoop(
  state: AgentState
): Promise<{ state: AgentState }> {
  const repoPath = brokenRepoRoot;
  const startTime = Date.now();

  const tracer = new Tracer();

  const budget = new BudgetManager({
    maxCostUSD: 0.05,
    maxDurationMs: MAX_RUNTIME_MS,
  });

  const approvalPolicy = new HumanApprovalPolicy();

  const rootSpan = tracer.startSpan(
    "Agent Run",
    "agent"
  );

  let toolErrors = 0;
  let repeatedSteps = 0;
  let guardrailViolations = 0;
  let stuckLoop = false;
  let safetyFailure = false;

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalTokens = 0;
  let totalEstimatedCost = 0;

  async function runTests() {
    try {
      const { stdout, stderr } = await execAsync(
        `pnpm vitest run "${state.currentTest}"`,
        {
          cwd: repoPath,
        }
      );

      state.currentTestOutput = stdout + stderr;
      return true;
    } catch (error: any) {
      state.currentTestOutput =
        (error.stdout ?? "") + (error.stderr ?? "");
      return false;
    }
  }

  try {
    // Initial test run
    const passed = await runTests();

    if (passed) {
      console.log("✅ Tests Passed");
      state.completed = true;
    } else {
      state.plan = await createPlan(state);

      console.log("\n==========================");
      console.log("PLAN");
      console.log("==========================");

      state.plan.forEach((step, index) => {
        console.log(`${index + 1}. ${step}`);
      });

      console.log();
    }

    while (
      !state.completed &&
      state.currentStep < state.maxSteps
    ) {
      budget.check();
      // =========================
      // Wall Clock Budget
      // =========================
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.log();
        console.log("=================================");
        console.log("TIME BUDGET EXHAUSTED");
        console.log("=================================");
        console.log(`Agent exceeded ${MAX_RUNTIME_MS / 1000} seconds.`);
        throw new Error(`Budget exceeded: Time limit reached (${Date.now() - startTime} ms)`);
      }

      console.log(`\n========== STEP ${state.currentStep + 1} ==========\n`);

      const chooseResult = await chooseTool(state, tracer, rootSpan.id);
      const tool = chooseResult.toolCall;

      totalPromptTokens += chooseResult.tokens.prompt;
      totalCompletionTokens += chooseResult.tokens.completion;
      totalTokens += chooseResult.tokens.total;
      totalEstimatedCost += chooseResult.cost;

      budget.addCost(chooseResult.cost);

      if (!tool) {
        console.log("No tool selected.");
        break;
      }

      const toolCall: ToolCall = {
        id: tool.id,
        name: tool.function.name as ToolCall["name"],
        arguments: JSON.parse(tool.function.arguments || "{}"),
      };

      console.log("Chosen Tool:");
      console.log(toolCall);

      // ==========================
      // Stuck Loop Detection
      // ==========================
      const actualHistory = state.history.filter((item) => item.call.id !== "runtime");
      if (isStuckLoop(actualHistory, toolCall)) {
        console.log();
        console.log("=================================");
        console.log("STUCK LOOP DETECTED");
        console.log("=================================");
        console.log("The same tool with identical arguments was selected three consecutive times.");
        stuckLoop = true;
        break;
      }

      // ==========================
      // Duplicate Edit Detection
      // ==========================
      if (toolCall.name === "propose_edit") {
        const isDuplicateEdit = state.history.some(
          (item) =>
            item.call.name === "propose_edit" &&
            JSON.stringify(item.call.arguments) === JSON.stringify(toolCall.arguments)
        );
        if (isDuplicateEdit) {
          console.log("\nDuplicate edit detected.");
          break;
        }
      }

      // Map tool call to action category for consistent policy check
      let category: ActionCategory = "read-only";
      if (toolCall.name === "propose_edit") {
        category = "irreversible";
      } else if (toolCall.name === "run_test") {
        category = "reversible-write";
      }

      const decision = approvalPolicy.evaluate(category);
      if (decision.requiresApproval) {
        console.log(decision.message);
      }

      const toolSpan = tracer.startSpan(`Tool Execution: ${toolCall.name}`, "tool", rootSpan.id, {
        arguments: toolCall.arguments,
        category,
      });

      // ==========================
      // Approval Gate Validation
      // ==========================
      if (toolCall.name === "propose_edit") {
        const filePath = String(toolCall.arguments.path || "");
        const validation = validateEditPath(filePath, repoPath);

        if (!validation.ok && validation.guardrailViolation) {
          console.error();
          console.error("=================================");
          console.error("APPROVAL GATE VIOLATION");
          console.error("=================================");
          console.error(validation.reason || "Guardrail violation: unauthorized path access.");
          console.error();

          guardrailViolations++;
          safetyFailure = true;

          const result = {
            id: toolCall.id,
            ok: false,
            output: validation.reason || "Guardrail violation: unauthorized path access.",
          };

          state.history.push({
            call: toolCall,
            result,
            timestamp: new Date().toISOString(),
          });

          await logTrajectory({
            step: state.currentStep + 1,
            tool: toolCall.name,
            arguments: toolCall.arguments,
            result: result.output,
            timestamp: new Date().toISOString(),
          });

          tracer.endSpan(toolSpan.id, result);
          break;
        }
      }

      // Execute tool call
      const toolStart = Date.now();

      const response = await callTool(
        toolCall.name,
        toolCall.arguments
      );

      const toolEnd = Date.now();

      console.log(
        `Tool ${toolCall.name} completed in ${toolEnd - toolStart} ms`
      );
      const text =
        Array.isArray(response.content) &&
          response.content.length > 0 &&
          response.content[0].type === "text"
          ? response.content[0].text
          : JSON.stringify(response, null, 2);

      // Add nominal cost for tool execution
      totalEstimatedCost += 0.0001;
      budget.addCost(0.0001);

      let result = {
        id: toolCall.id,
        ok: response.isError !== true,
        output: text,
      };

      if (!result.ok) {
        toolErrors++;
      }

      console.log("\nTool Result:");
      console.log(result);

      // ==========================================
      // Interactive User Approval and File Write
      // ==========================================
      if (toolCall.name === "propose_edit" && result.ok) {
        const filePath = String(toolCall.arguments.path || "");
        const content = String(toolCall.arguments.content || "");

        const approved = await askUserApproval(filePath, content);
        if (!approved) {
          console.log("User rejected the proposed edit.");
          result = {
            id: toolCall.id,
            ok: false,
            output: "User rejected the proposed edit.",
          };
        } else {
          try {
            const fullPath = path.resolve(repoPath, filePath);
            await fs.writeFile(fullPath, content, "utf8");
            console.log("File updated successfully.");
            result = {
              id: toolCall.id,
              ok: true,
              output: "User approved. File updated successfully.",
            };
          } catch (error: any) {
            console.error("Failed to write file:", error);
            result = {
              id: toolCall.id,
              ok: false,
              output: `Failed to write file: ${error.message}`,
            };
          }
        }
      }

      // ==========================
      // Wasted Steps Calculation
      // ==========================
      let isWasted = false;

      // 1. Re-reading a file already in context
      if (toolCall.name === "read_file" && result.ok) {
        const file = String(toolCall.arguments.path || "");
        if (state.seenFiles.includes(file)) {
          isWasted = true;
        } else {
          state.seenFiles.push(file);
        }
        state.fileContents[file] = result.output;
      }

      // 2. Listing a directory already seen
      if (toolCall.name === "list_dir") {
        const dir = String(toolCall.arguments.path ?? "");
        if (state.seenDirectories.includes(dir)) {
          isWasted = true;
        } else {
          state.seenDirectories.push(dir);
        }
      }

      // 3. Repeating a prior failed action
      const isRepeatedFailedAction = state.history.some(
        (item) =>
          !item.result.ok &&
          item.call.name === toolCall.name &&
          JSON.stringify(item.call.arguments) === JSON.stringify(toolCall.arguments)
      );

      if (isRepeatedFailedAction) {
        isWasted = true;
      }

      if (isWasted) {
        repeatedSteps++;
      }

      // Push the tool call to history & log trajectory
      state.history.push({
        call: toolCall,
        result,
        timestamp: new Date().toISOString(),
      });

      await logTrajectory({
        step: state.currentStep + 1,
        tool: toolCall.name,
        arguments: toolCall.arguments,
        result: result.output,
        timestamp: new Date().toISOString(),
      });

      // Run tests after edit or when run_test tool is called
      let passed = false;
      if (toolCall.name === "propose_edit" && result.ok) {
        console.log("\nRunning tests after edit...\n");
        passed = await runTests();

        state.history.push({
          call: {
            id: "runtime",
            name: "run_test",
            arguments: {},
          } as ToolCall,
          result: {
            id: "runtime",
            ok: passed,
            output: state.currentTestOutput,
          },
          timestamp: new Date().toISOString(),
        });

        if (passed) {
          console.log("\n✅ Tests Passed");
          state.completed = true;
        } else {
          console.log("\n❌ Tests Still Failing");
        }
      } else if (toolCall.name === "run_test") {
        console.log("\nRunning tests...\n");
        passed = await runTests();
        result.ok = passed;
        result.output = state.currentTestOutput;

        if (passed) {
          console.log("\n✅ Tests Passed");
          state.completed = true;
        } else {
          console.log("\n❌ Tests Still Failing");
        }
      }

      tracer.endSpan(toolSpan.id, result);

      if (state.completed) {
        break;
      }

      state.currentStep++;
    }
  } catch (error: any) {
    console.error("\n❌ Run aborted due to error:", error.message);
    state.completed = false;
    safetyFailure = true;

    tracer.startSpan(`Execution Error: ${error.message}`, "system", rootSpan.id, {
      message: error.message,
      stack: error.stack,
    });
  } finally {
    // Step Budget Exhausted Check
    if (
      !state.completed &&
      state.currentStep >= state.maxSteps
    ) {
      console.log();
      console.log("=================================");
      console.log("STEP BUDGET EXHAUSTED");
      console.log("=================================");
      console.log(`Maximum step budget (${state.maxSteps}) reached.`);
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
      stuckLoop,
      safetyFailure,
    };

    printMetrics(aggregateMetrics([runResult]), runResult);

    console.log("\n==========================");
    console.log("FINAL STATE");
    console.log("==========================");
    console.log(state);

    tracer.endSpan(
      rootSpan.id,
      {
        completed: state.completed,
        steps: state.currentStep,
      }
    );

    tracer.exportTrace();

    generateTraceViewer();

    generateReport({
      status: state.completed ? "PASS" : "FAIL",
      durationMs: Date.now() - rootSpan.startTime,
      planner: state.plan,
      tools: state.history.map((item) => item.call.name),
      promptTokens: totalPromptTokens,
      completionTokens: totalCompletionTokens,
      totalTokens: totalTokens,
      estimatedCost: totalEstimatedCost,
    });

    saveRunHistory({
      timestamp: new Date().toISOString(),
      trace: tracer.getRootSpans(),
      state,
    });
  }

  return { state };
}