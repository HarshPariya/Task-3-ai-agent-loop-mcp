import { randomUUID } from "crypto";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

import { listDirTool } from "../../tools/listDir";
import { readFileTool } from "../../tools/readFile";
import { grepTool } from "../../tools/grep";
import { proposeEditTool } from "../../tools/proposeEdit";
import { runTest } from "../../tools/runTest";

function textResponse(
  text: string,
  isError = false
) {
  return {
    content: [
      {
        type: "text" as const,
        text,
      },
    ],
    isError,
  };
}

export function registerTools(server: McpServer) {
  server.registerTool(
    "list_dir",
    {
      description: "List files and folders inside a directory.",
      inputSchema: {
        path: z.string().default("."),
      },
    },
    async ({ path }) => {
      const result = await listDirTool({
        id: randomUUID(),
        name: "list_dir",
        arguments: { path },
      });

      return textResponse(result.output, !result.ok);
    }
  );

  server.registerTool(
    "read_file",
    {
      description: "Read the contents of a source file.",
      inputSchema: {
        path: z.string(),
      },
    },
    async ({ path }) => {
      const result = await readFileTool({
        id: randomUUID(),
        name: "read_file",
        arguments: { path },
      });

      return textResponse(result.output, !result.ok);
    }
  );

  server.registerTool(
    "grep",
    {
      description: "Search for a pattern inside repository files.",
      inputSchema: {
        path: z.string(),
        pattern: z.string(),
      },
    },
    async ({ path, pattern }) => {
      const result = await grepTool({
        id: randomUUID(),
        name: "grep",
        arguments: {
          path,
          pattern,
        },
      });

      return textResponse(result.output, !result.ok);
    }
  );

  server.registerTool(
    "propose_edit",
    {
      description:
        "Propose a complete replacement for a file. User approval is required before applying the edit.",
      inputSchema: {
        path: z.string(),
        content: z.string(),
      },
    },
    async ({ path, content }) => {
      const result = await proposeEditTool({
        id: randomUUID(),
        name: "propose_edit",
        arguments: {
          path,
          content,
        },
      });

      return textResponse(result.output, !result.ok);
    }
  );

  server.registerTool(
    "run_test",
    {
      description: "Run the project's test suite.",
      inputSchema: {},
    },
    async () => {
      const result = await runTest({
        id: randomUUID(),
        name: "run_test",
        arguments: {},
      });

      return textResponse(result.output, !result.ok);
    }
  );
}