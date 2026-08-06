import { describe, expect, it } from "vitest";
import { formatLocal } from "../src/date";
describe("Date conversion", () => {
  it("adds offset correctly", () => {
    expect(formatLocal(0)).toBe(5 * 3600 * 1000);
  });
});
