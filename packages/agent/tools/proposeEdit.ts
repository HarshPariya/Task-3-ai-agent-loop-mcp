import { ToolCall } from "../types/ToolCall";
import { ToolResult } from "../types/ToolResult";
import { applyEdit } from "../src/approval/applyEdit";

export async function proposeEditTool(
  tool: ToolCall
): Promise<ToolResult> {

  try {

    const filePath = String(tool.arguments.path);

    const content = String(tool.arguments.content);

    const result = await applyEdit(
      filePath,
      content
    );

    if (!result.applied) {

      return {
        id: tool.id,
        ok: false,
        output: "User rejected the proposed edit.",
      };

    }

    return {

      id: tool.id,

      ok: true,

      output: "User approved. File updated successfully.",

    };

  } catch (error: any) {

    return {

      id: tool.id,

      ok: false,

      output: error.message,

    };

  }

}