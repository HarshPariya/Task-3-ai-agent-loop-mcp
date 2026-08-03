export interface ToolResult {
  id: string;
  ok: boolean;
  output: string;
  truncated?: boolean;
}