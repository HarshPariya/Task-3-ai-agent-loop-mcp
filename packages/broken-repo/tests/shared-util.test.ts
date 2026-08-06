import { describe, expect, it } from "vitest";
import { sharedHelper } from "../src/shared-util";
describe("Shared helper", () => {
  it("returns square of input", () => {
    expect(sharedHelper(3)).toBe(9);
  });
});
