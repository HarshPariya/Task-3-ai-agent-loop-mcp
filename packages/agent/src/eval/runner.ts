import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EvalCase {
  id: string;
  difficulty: string;
  test: string;
}

interface EvalResult {
  id: string;
  difficulty: string;
  success: boolean;
  durationMs: number;
}

export interface EvalOptions {
  baselineFile?: string;
  live?: boolean;
}

async function runCase(
  test: string
): Promise<EvalResult> {
  const start = Date.now();

  try {
    const { stdout, stderr } =
      await execAsync(
        `pnpm tsx src/index.ts ${test}`,
        {
          cwd: path.resolve(__dirname, "../.."),
          timeout: 180_000,
        }
      );

    console.log(stdout);

    if (stderr) {
      console.error(stderr);
    }

    const success =
      stdout.includes("✅ Tests Passed") ||
      stdout.includes('"completed": true');

    return {
      id: test,
      difficulty: "",
      success,
      durationMs: Date.now() - start,
    };
  } catch (error: any) {
    console.log("=================================");
    console.log("FAILED CASE:", test);
    console.log("=================================");

    console.log(error.stdout ?? "");

    console.error(error.stderr ?? "");

    return {
      id: test,
      difficulty: "",
      success: false,
      durationMs: Date.now() - start,
    };
  }
}

export async function runEval(
  options: EvalOptions = {}
): Promise<void> {
  process.env.AUTO_APPLY = "true";
  const evalFile = path.resolve(
    __dirname,
    "../../../../evals/golden-agent.jsonl"
  );

  console.log("Loading:", evalFile);

  const text = await fs.readFile(
    evalFile,
    "utf8"
  );

  const cases = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(
      (line) =>
        JSON.parse(line) as EvalCase
    );

  console.log("\n==============================");
  console.log("Evaluation");
  console.log("==============================\n");

  const results: EvalResult[] = [];

  for (const item of cases) {
    console.log(
      `Running ${item.id} (${item.difficulty})`
    );

    const result = await runCase(
      item.test
    );

    result.id = item.id;
    result.difficulty =
      item.difficulty;

    results.push(result);

    console.log(
      result.success
        ? "✅ PASS"
        : "❌ FAIL"
    );

    console.log();
  }

  const logsDir = path.resolve(
    __dirname,
    "../../logs"
  );

  await fs.mkdir(logsDir, {
    recursive: true,
  });

  const outputFile = path.join(
    logsDir,
    "eval-results.json"
  );

  await fs.writeFile(
    outputFile,
    JSON.stringify(
      results,
      null,
      2
    )
  );

  console.log(
    "Saved:",
    outputFile
  );

  if (options.baselineFile) {
    console.log(
      "\n=============================="
    );
    console.log(
      "Baseline Comparison"
    );
    console.log(
      "=============================="
    );

    const baseline = JSON.parse(
      await fs.readFile(
        path.resolve(
          options.baselineFile
        ),
        "utf8"
      )
    ) as EvalResult[];

    let improvements = 0;
    let regressions = 0;

    for (const current of results) {
      const previous =
        baseline.find(
          (b) =>
            b.id === current.id
        );

      if (!previous) continue;

      if (
        previous.success &&
        !current.success
      ) {
        regressions++;
      }

      if (
        !previous.success &&
        current.success
      ) {
        improvements++;
      }
    }

    console.log(
      `Improvements: ${improvements}`
    );

    console.log(
      `Regressions: ${regressions}`
    );

    console.log(
      regressions === 0
        ? "✅ No regressions."
        : "❌ Regression detected."
    );
  }

  console.log();

  console.table(results);
  const average =
    results.reduce(
      (sum, r) => sum + r.durationMs,
      0
    ) / results.length;

  console.log(
    `Average Time: ${average.toFixed(0)} ms`
  );

  console.log();

  console.log(
    `Passed ${results.filter(
      (r) => r.success
    ).length
    } / ${results.length}`
  );
}