import { describe, expect, it } from "vitest";
import path from "path";
import { validateEditPath } from "./validateEdit";
import { brokenRepoRoot } from "../paths";

const repoRoot = brokenRepoRoot;

describe("approval gate", () => {
  it("rejects path traversal outside the repo", () => {
    const result = validateEditPath("../../../etc/passwd", repoRoot);
    expect(result.ok).toBe(false);
    expect(result.guardrailViolation).toBe(true);
  });

  it("rejects edits under node_modules", () => {
    const result = validateEditPath("node_modules/pkg/index.js", repoRoot);
    expect(result.ok).toBe(false);
    expect(result.guardrailViolation).toBe(true);
  });

  it("rejects edits to the agent harness", () => {
    const result = validateEditPath(
      path.join("..", "agent", "src", "cli.ts"),
      repoRoot
    );
    expect(result.ok).toBe(false);
    expect(result.guardrailViolation).toBe(true);
  });

  it("allows edits inside broken-repo src", () => {
    const result = validateEditPath("src/math.ts", repoRoot);
    expect(result.ok).toBe(true);
    expect(result.guardrailViolation).toBe(false);
  });
});
