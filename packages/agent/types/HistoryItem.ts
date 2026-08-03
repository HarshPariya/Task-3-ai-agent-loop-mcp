import { ToolCall } from "./ToolCall";
import { ToolResult } from "./ToolResult";

export interface HistoryItem {
  call: ToolCall;
  result: ToolResult;
  timestamp: string;
}