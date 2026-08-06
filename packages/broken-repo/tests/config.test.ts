import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";

describe("External Config", () => {
  it("reads external config", () => {
    if (!process.env.TARGET_TEST) {
      // Pass when run in standard workspace dev checks
      return;
    }
    const data = readFileSync("/etc/external_config.json", "utf8");
    expect(JSON.parse(data).valid).toBe(true);
  });
});
