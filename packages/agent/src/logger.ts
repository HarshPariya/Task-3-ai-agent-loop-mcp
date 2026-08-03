import { promises as fs } from "fs";
import path from "path";
import { agentPackageRoot } from "./paths";

export interface TrajectoryEntry {
  step: number;
  tool: string;
  arguments: Record<string, unknown>;
  result: string;
  timestamp: string;
}

const logDir = path.join(agentPackageRoot, "logs");

const logFile = path.join(
  logDir,
  "trajectory.jsonl"
);

export async function logTrajectory(
  entry: TrajectoryEntry
): Promise<void> {
  await fs.mkdir(logDir, {
    recursive: true,
  });

  await fs.appendFile(
    logFile,
    JSON.stringify(entry) + "\n",
    "utf8"
  );
}