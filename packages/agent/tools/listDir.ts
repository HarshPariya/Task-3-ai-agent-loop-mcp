import { promises as fs } from "fs";
import path from "path";
import { ToolCall } from "../types/ToolCall";
import { ToolResult } from "../types/ToolResult";
import { repoRoot } from "./paths";

export async function listDirTool(
  tool: ToolCall
): Promise<ToolResult> {
  try {
    const relativePath = (tool.arguments.path as string) || ".";
    const folder = path.join(repoRoot, relativePath);

    const files = await fs.readdir(folder);

    return {
      id: tool.id,
      ok: true,
      output: JSON.stringify(files, null, 2),
    };
  } catch (error: any) {
    return {
      id: tool.id,
      ok: false,
      output: error.message,
    };
  }
}