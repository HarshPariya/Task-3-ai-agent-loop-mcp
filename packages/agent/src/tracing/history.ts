import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { workspaceRoot } from "../paths.js";

export function saveRunHistory(data: unknown) {
    const historyDir = join(workspaceRoot, "generated", "history");

    if (!existsSync(historyDir)) {
        mkdirSync(historyDir, {
            recursive: true,
        });
    }

    const files = readdirSync(historyDir)
        .filter((file) => file.startsWith("run-"))
        .sort();

    const nextNumber = files.length + 1;

    const fileName = `run-${String(nextNumber).padStart(3, "0")}.json`;

    writeFileSync(
        join(historyDir, fileName),
        JSON.stringify(data, null, 2),
        "utf8"
    );

    console.log(`History saved -> ${join(historyDir, fileName)}`);
}