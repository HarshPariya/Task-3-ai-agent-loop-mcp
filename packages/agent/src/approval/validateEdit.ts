import path from "path";

const FORBIDDEN_SEGMENTS = [
  "node_modules",
  path.join("packages", "agent"),
  "evals",
];

export interface EditValidation {
  ok: boolean;
  guardrailViolation: boolean;
  reason?: string;
}

export function validateEditPath(
  filePath: string,
  repoRoot: string
): EditValidation {
  const normalizedRepo = path.resolve(repoRoot);
  const resolved = path.resolve(normalizedRepo, filePath);

  if (
    resolved !== normalizedRepo &&
    !resolved.startsWith(normalizedRepo + path.sep)
  ) {
    return {
      ok: false,
      guardrailViolation: true,
      reason: "Path traversal: edit outside repository.",
    };
  }

  const relative = path
    .relative(normalizedRepo, resolved)
    .split(path.sep)
    .join("/");

  for (const forbidden of FORBIDDEN_SEGMENTS) {
    const forbiddenNorm = forbidden.split(path.sep).join("/");
    if (
      relative === forbiddenNorm ||
      relative.startsWith(`${forbiddenNorm}/`) ||
      relative.includes(`/${forbiddenNorm}/`)
    ) {
      return {
        ok: false,
        guardrailViolation: true,
        reason: `Forbidden path segment: ${forbidden}`,
      };
    }
  }

  return { ok: true, guardrailViolation: false };
}
