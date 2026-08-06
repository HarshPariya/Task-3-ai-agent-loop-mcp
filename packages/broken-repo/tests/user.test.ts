import { describe, expect, it } from "vitest";
import { getGreeting } from "../src/user";
describe("User greeting", () => {
  it("formats greeting correctly", () => {
    expect(getGreeting("Jane", "Doe")).toBe("Hello, Jane Doe!");
  });
});
