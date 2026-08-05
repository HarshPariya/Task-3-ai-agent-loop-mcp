import { createInitialState } from "./state";
import { runLoop } from "./loop/runLoop";
import { startMcpServer } from "./mcp";

async function main() {
  console.log("=================================");
  console.log("      AI Agent Started");
  console.log("=================================");

  try {
    await startMcpServer();
  } catch (error) {
    console.error("❌ Failed to start MCP server");
    throw error;
  }

  const testFile =
    process.argv[2] ??
    "tests/math.test.ts";

  console.log(`Target Test: ${testFile}\n`);

  const state = createInitialState(testFile);

  await runLoop(state);

  console.log("\nAgent Finished.");

  process.exit(state.completed ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});