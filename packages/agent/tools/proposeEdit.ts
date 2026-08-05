import { ToolCall } from "../types/ToolCall";
import { ToolResult } from "../types/ToolResult";
import { validateEditPath } from "../src/approval/validateEdit";
import { brokenRepoRoot } from "../src/paths";

export async function proposeEditTool(
  tool: ToolCall
): Promise<ToolResult> {
  try {
    const filePath = String(tool.arguments.path);
    const validation = validateEditPath(filePath, brokenRepoRoot);

    if (!validation.ok) {
      return {
        id: tool.id,
        ok: false,
        output: validation.reason || "Guardrail violation: unauthorized path access.",
      };
    }

    return {
      id: tool.id,
      ok: true,
      output: "Proposed edit received and validated. Awaiting harness approval.",
    };
  } catch (error: any) {
    return {
      id: tool.id,
      ok: false,
      output: error.message,
    };
  }
}