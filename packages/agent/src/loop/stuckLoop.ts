import { HistoryItem } from "../../types/HistoryItem";
import { ToolCall } from "../../types/ToolCall";

export function isStuckLoop(
  history: HistoryItem[],
  currentCall: ToolCall
): boolean {
  if (history.length < 2) {
    return false;
  }

  const lastTwo = history.slice(-2);
  return lastTwo.every(
    (item) =>
      item.call.name === currentCall.name &&
      JSON.stringify(item.call.arguments) ===
        JSON.stringify(currentCall.arguments)
  );
}
