import { ToolCall } from "../types/ToolCall";
import { ToolResult } from "../types/ToolResult";
import { grepTool } from "../tools/grep";
import { listDirTool } from "../tools/listDir";
import { proposeEditTool } from "../tools/proposeEdit";
import { readFileTool } from "../tools/readFile";
import { runTest } from "../tools/runTest";

export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
  switch (toolCall.name) {
    case "read_file":
      return readFileTool(toolCall);
    case "list_dir":
      return listDirTool(toolCall);
    case "grep":
      return grepTool(toolCall);
    case "propose_edit":
      return proposeEditTool(toolCall);
    case "run_test":
      return runTest(toolCall);
    default:
      return {
        id: toolCall.id,
        ok: false,
        output: `Unknown tool: ${toolCall.name}`,
      };
  }
}
