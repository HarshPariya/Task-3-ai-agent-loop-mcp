import { describe, expect, it } from "vitest";
import { isStuckLoop } from "./stuckLoop";
import { HistoryItem } from "../../types/HistoryItem";

function historyItem(
  name: HistoryItem["call"]["name"],
  args: Record<string, unknown>
): HistoryItem {
  return {
    call: {
      id: "1",
      name,
      arguments: args,
    },
    result: {
      id: "1",
      ok: false,
      output: "error",
    },
    timestamp: new Date().toISOString(),
  };
}

describe("stuck loop detector", () => {
  it("does not trigger on fewer than two prior identical calls", () => {
    const history = [historyItem("grep", { path: "src", pattern: "foo" })];
    const current = {
      id: "2",
      name: "grep" as const,
      arguments: { path: "src", pattern: "foo" },
    };

    expect(isStuckLoop(history, current)).toBe(false);
  });

  it("triggers when the same call would run a third time", () => {
    const call = { path: "src", pattern: "foo" };
    const history = [
      historyItem("grep", call),
      historyItem("grep", call),
    ];
    const current = {
      id: "3",
      name: "grep" as const,
      arguments: call,
    };

    expect(isStuckLoop(history, current)).toBe(true);
  });
});
