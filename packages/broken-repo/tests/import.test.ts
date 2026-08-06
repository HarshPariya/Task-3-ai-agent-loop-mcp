import { describe, expect, it } from "vitest";
import { getValue } from "../src/value";
describe("Import path", () => {
  it("gets value", () => {
    expect(getValue()).toBe(42);
  });
});
