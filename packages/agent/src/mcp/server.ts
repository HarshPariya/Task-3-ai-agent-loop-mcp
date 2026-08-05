import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import { registerTools } from "./registerTools";

export const mcpServer = new McpServer({
  name: "agent-loop",
  version: "1.0.0",
});

console.error("MCP Server Initialized");

const isMain =
  process.argv[1] &&
  (process.argv[1].endsWith("server.ts") ||
    process.argv[1].endsWith("server.js") ||
    process.argv[1].endsWith("server"));

if (isMain) {
  const transport = new StdioServerTransport();
  registerTools(mcpServer);
  mcpServer.connect(transport).catch((error) => {
    console.error("MCP Server failed to start:", error);
    process.exit(1);
  });
}