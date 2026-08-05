import path from "path";
import { fileURLToPath } from "url";

const srcDir = path.dirname(fileURLToPath(import.meta.url));

export const agentPackageRoot = path.resolve(srcDir, "..");

export const workspaceRoot = path.resolve(
  agentPackageRoot,
  "../.."
);

export const brokenRepoRoot = path.resolve(
  agentPackageRoot,
  "../broken-repo"
);

export function envFilePath(): string {
  return path.join(workspaceRoot, ".env");
}

export function goldenEvalPath(): string {
  return path.join(
    workspaceRoot,
    "evals",
    "golden-agent.jsonl"
  );
}

export function evalResultsPath(): string {
  return path.join(
    agentPackageRoot,
    "logs",
    "eval-results.json"
  );
}