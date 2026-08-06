import {
    existsSync,
    mkdirSync,
    readdirSync,
    writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { workspaceRoot } from "../paths.js";

interface ReportData {
    status: string;
    durationMs: number;
    planner: string[];
    tools: string[];
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
}

export function generateReport(data: ReportData) {
    const reportDir = join(workspaceRoot, "generated", "reports");

    if (!existsSync(reportDir)) {
        mkdirSync(reportDir, {
            recursive: true,
        });
    }

    const reports = readdirSync(reportDir)
        .filter(file => file.startsWith("run-"))
        .sort();

    const runNumber = reports.length + 1;

    const runId = `run-${String(runNumber).padStart(3, "0")}`;

    const markdown = `# Agent Execution Report

Run ID: ${runId}

Generated:
${new Date().toLocaleString()}

Status:
${data.status}

Duration:
${data.durationMs} ms

---

## Planner

${data.planner.map(step => `- ${step}`).join("\n")}

---

## Tools Used

${data.tools.map((tool, index) => `${index + 1}. ${tool}`).join("\n")}

---

## Token Usage

Prompt Tokens: ${data.promptTokens}

Completion Tokens: ${data.completionTokens}

Total Tokens: ${data.totalTokens}

---

Estimated Cost

$${data.estimatedCost}

`;

    writeFileSync(
        join(reportDir, `${runId}.md`),
        markdown,
        "utf8"
    );

    console.log(`Report generated -> ${join(reportDir, `${runId}.md`)}`);
}