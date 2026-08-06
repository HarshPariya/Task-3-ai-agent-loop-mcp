import { describe, expect, it } from "vitest";
import { concat } from "../src/string";
describe("String Concat", () => {
  it("concatenates with space", () => {
    expect(concat("hello", "world")).toBe("hello world");
  });
});
