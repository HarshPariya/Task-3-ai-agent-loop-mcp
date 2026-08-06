import { describe, expect, it } from "vitest";
import { getLastElement } from "../src/index-util";
describe("Array index", () => {
  it("gets last element", () => {
    expect(getLastElement([1, 2, 3])).toBe(3);
  });
});
