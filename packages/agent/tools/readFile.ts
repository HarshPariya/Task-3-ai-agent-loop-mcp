import { promises as fs } from "fs";
import path from "path";
import { ToolCall } from "../types/ToolCall";
import { ToolResult } from "../types/ToolResult";
import { repoRoot } from "./paths";

export async function readFileTool(
  tool: ToolCall
): Promise<ToolResult> {
  try {
    const relativePath = tool.arguments.path as string;
    const filePath = path.join(repoRoot, relativePath);

    const content = await fs.readFile(filePath, "utf8");

    return {
      id: tool.id,
      ok: true,
      output: content,
    };
  } catch (error: any) {
    return {
      id: tool.id,
      ok: false,
      output: error.message,
    };
  }
}