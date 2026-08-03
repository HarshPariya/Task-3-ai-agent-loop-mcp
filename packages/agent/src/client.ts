import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { agentPackageRoot } from "./paths";

let client: Client | null = null;

export async function getMcpClient() {
  if (client) {
    return client;
  }

  client = new Client(
    {
      name: "agent-loop-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  const transport = new StdioClientTransport({
    command: "pnpm",
    args: ["tsx", "src/mcp/server.ts"],
    cwd: agentPackageRoot,
  });

  await client.connect(transport);

  console.log("✅ MCP Client Connected");

  return client;
}

export async function callTool(
  name: string,
  args: Record<string, any>
) {
  const client = await getMcpClient();

  return client.callTool({
    name,
    arguments: args,
  });
}