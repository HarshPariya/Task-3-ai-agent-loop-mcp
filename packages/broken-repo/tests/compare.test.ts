import { describe, expect, it } from "vitest";
import { isEqual } from "../src/compare";
describe("Comparison", () => {
  it("compares numbers", () => {
    expect(isEqual(5, 5)).toBe(true);
  });
});
