import { mcpServer } from "./server";
import { transport } from "./transport";
import { registerTools } from "./registerTools";

export async function startMcpServer() {
  registerTools(mcpServer);
  await mcpServer.connect(transport);
}
