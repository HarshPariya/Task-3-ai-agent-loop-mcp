import { createInitialState } from "./state";
import { runLoop } from "./loop";
import { startMcpServer } from "./mcp";

async function main() {
  console.log("=================================");
  console.log("      AI Agent Started");
  console.log("=================================");

  await startMcpServer();

  const testFile =
    process.argv[2] ??
    "tests/math.test.ts";

  console.log(
    `Target Test: ${testFile}\n`
  );

  const state =
    createInitialState(testFile);

  await runLoop(state);

  console.log("\nAgent Finished.");
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});