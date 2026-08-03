import path from "path";
import { fileURLToPath } from "url";
import {
  agentPackageRoot,
  brokenRepoRoot,
} from "../src/paths";

const toolsDir = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = brokenRepoRoot;
export const agentRoot = agentPackageRoot;
export const toolsRoot = path.resolve(toolsDir, "..");
