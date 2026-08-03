import { exec } from "child_process";
import { promisify } from "util";
import { ToolCall } from "../types/ToolCall";
import { ToolResult } from "../types/ToolResult";
import { repoRoot } from "./paths";

const execAsync = promisify(exec);

export async function runTest(
  tool: ToolCall
): Promise<ToolResult> {

  const repoPath = repoRoot;

  try {

    const { stdout, stderr } = await execAsync(
      "pnpm test",
      {
        cwd: repoPath,
      }
    );

    return {
      id: tool.id,
      ok: true,
      output: stdout + stderr,
    };

  } catch (error: any) {

    return {
      id: tool.id,
      ok: false,
      output:
        error.stdout +
        error.stderr,
    };

  }

}