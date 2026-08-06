import { describe, expect, it } from "vitest";
import { fetchUser } from "../src/api";
describe("API url builder", () => {
  it("builds correct user url", () => {
    expect(fetchUser()).toBe("https://api.example.com/users/1");
  });
});
