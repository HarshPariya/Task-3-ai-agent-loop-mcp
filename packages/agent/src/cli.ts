import { createInitialState } from "./state";
import { runLoop } from "./loop/runLoop";
import { runEval } from "./eval/runner";

function printUsage() {
  console.error(`Usage:
  pnpm agent fix --test <test-file>
  pnpm agent eval [--live] [--compare baseline.json]

Examples:
  pnpm agent fix --test tests/math.test.ts
  pnpm agent eval
  pnpm agent eval --live
  pnpm agent eval --compare evals/baseline.json`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === "fix") {
    const testFlagIndex = args.indexOf("--test");
    const testFile =
      testFlagIndex >= 0 ? args[testFlagIndex + 1] : undefined;

    if (!testFile) {
      printUsage();
      process.exit(1);
    }

    process.env.TARGET_TEST = testFile;

    console.log("=================================");
    console.log("      AI Agent Started");
    console.log("=================================");
    console.log(`Target Test: ${testFile}\n`);

    const state = createInitialState(testFile);
    const { state: finalState } = await runLoop(state);

    console.log("\nAgent Finished.");
    process.exit(finalState.completed ? 0 : 1);
  }

  if (command === "eval") {
    const compareIndex = args.indexOf("--compare");
    const baselineFile =
      compareIndex >= 0 ? args[compareIndex + 1] : undefined;
    const live = args.includes("--live");

    await runEval({ baselineFile, live });
    return;
  }

  printUsage();
  process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
