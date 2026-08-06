import { describe, expect, it } from "vitest";
import { getLength } from "../src/null";
describe("Null check", () => {
  it("handles null value safely", () => {
    expect(getLength(null)).toBe(0);
    expect(getLength("test")).toBe(4);
  });
});
