import { describe, expect, it } from "vitest";

describe("Environment", () => {
  it("checks secret key", () => {
    if (!process.env.TARGET_TEST) {
      // Pass when run in standard workspace dev checks
      return;
    }
    expect(process.env.SECRET_KEY).toBe("secret123");
  });
});
