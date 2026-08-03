import { McpServer } from "@modelcontextprotocol/sdk/server/mcp";

export const mcpServer = new McpServer({
  name: "agent-loop",
  version: "1.0.0",
});

console.log("MCP Server Initialized");