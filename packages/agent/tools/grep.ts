import { promises as fs } from "fs";
import path from "path";
import { ToolCall } from "../types/ToolCall";
import { ToolResult } from "../types/ToolResult";
import { repoRoot } from "./paths";

async function searchFile(
  filePath: string,
  pattern: string,
  results: string[]
) {
  try {
    const content = await fs.readFile(
      filePath,
      "utf8"
    );

    const matches = content
      .split("\n")
      .filter((line) =>
        line.includes(pattern)
      );

    if (matches.length > 0) {
      results.push(
        `\n=== ${path.relative(
          process.cwd(),
          filePath
        )} ===`
      );

      results.push(...matches);
    }
  } catch {
    // Ignore unreadable files
  }
}

async function searchDirectory(
  dir: string,
  pattern: string,
  results: string[]
) {
  const entries =
    await fs.readdir(dir, {
      withFileTypes: true,
    });

  for (const entry of entries) {
    const fullPath = path.join(
      dir,
      entry.name
    );

    if (entry.isDirectory()) {
      await searchDirectory(
        fullPath,
        pattern,
        results
      );
    } else {
      await searchFile(
        fullPath,
        pattern,
        results
      );
    }
  }
}

export async function grepTool(
  tool: ToolCall
): Promise<ToolResult> {
  try {
    const pattern = String(
      tool.arguments.pattern ?? ""
    );

    const relativePath = String(
      tool.arguments.path ?? ""
    );

    const targetPath = path.join(
      repoRoot,
      relativePath
    );

    const stats =
      await fs.stat(targetPath);

    const results: string[] = [];

    if (stats.isDirectory()) {
      await searchDirectory(
        targetPath,
        pattern,
        results
      );
    } else {
      await searchFile(
        targetPath,
        pattern,
        results
      );
    }

    return {
      id: tool.id,
      ok: true,
      output:
        results.length > 0
          ? results.join("\n")
          : "No matches found.",
    };
  } catch (error: any) {
    return {
      id: tool.id,
      ok: false,
      output: error.message,
    };
  }
}