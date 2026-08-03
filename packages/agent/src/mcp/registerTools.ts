import { randomUUID } from "crypto";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

import { listDirTool } from "../../tools/listDir";
import { readFileTool } from "../../tools/readFile";
import { grepTool } from "../../tools/grep";
import { proposeEditTool } from "../../tools/proposeEdit";
import { runTest } from "../../tools/runTest";

export function registerTools(server: McpServer) {
  server.registerTool(
    "list_dir",
    {
      description: "List directory",
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

      return {
        content: [
          {
            type: "text",
            text: result.output,
          },
        ],
      };
    }
  );

  server.registerTool(
    "read_file",
    {
      description: "Read file",
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

      return {
        content: [
          {
            type: "text",
            text: result.output,
          },
        ],
      };
    }
  );

  server.registerTool(
    "grep",
    {
      description: "Search inside file",
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

      return {
        content: [
          {
            type: "text",
            text: result.output,
          },
        ],
      };
    }
  );

  server.registerTool(
    "propose_edit",
    {
      description: "Propose a file edit (requires approval before applying)",
      inputSchema: {
        path: z.string(),
        content: z.string(),
      },
    },
    async ({ path, content }) => {
      const result = await proposeEditTool({
        id: randomUUID(),
        name: "propose_edit",
        arguments: { path, content },
      });

      return {
        content: [
          {
            type: "text",
            text: result.output,
          },
        ],
        isError: !result.ok,
      };
    }
  );

  server.registerTool(
    "run_test",
    {
      description: "Run project tests",
      inputSchema: {},
    },
    async () => {
      const result = await runTest({
        id: randomUUID(),
        name: "run_test",
        arguments: {},
      });

      return {
        content: [
          {
            type: "text",
            text: result.output,
          },
        ],
      };
    }
  );
}