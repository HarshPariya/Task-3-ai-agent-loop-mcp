import { describe, expect, it } from "vitest";
import { isAdmin } from "../src/auth";
describe("Auth", () => {
  it("checks if admin", () => {
    expect(isAdmin()).toBe(true);
  });
});
