export interface RunResult {
  success: boolean;
  steps: number;
  maxSteps: number;
  wastedSteps: number;
  toolErrors: number;
  guardrailViolations: number;
  durationMs: number;
  stuckLoop?: boolean;
  safetyFailure?: boolean;
}

export interface AggregateMetrics {
  success?: boolean;
  successAtBudget: number;
  meanStepsToSuccess: number;
  wastedStepRatio: number;
  toolCallErrorRate: number;
  guardrailViolations: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  totalRuns: number;
  successfulRuns: number;
}

export function aggregateMetrics(
  runs: RunResult[]
): AggregateMetrics {
  const totalRuns = runs.length;
  const successfulRuns = runs.filter((run) => run.success);
  const successAtBudget =
    totalRuns === 0
      ? 0
      : successfulRuns.length / totalRuns;

  const meanStepsToSuccess =
    successfulRuns.length === 0
      ? 0
      : successfulRuns.reduce((sum, run) => sum + run.steps, 0) /
        successfulRuns.length;

  const totalSteps = runs.reduce((sum, run) => sum + run.steps, 0);
  const totalWasted = runs.reduce(
    (sum, run) => sum + run.wastedSteps,
    0
  );
  const wastedStepRatio =
    totalSteps === 0 ? 0 : totalWasted / totalSteps;

  const totalToolCalls = runs.reduce(
    (sum, run) => sum + run.steps,
    0
  );
  const totalToolErrors = runs.reduce(
    (sum, run) => sum + run.toolErrors,
    0
  );
  const toolCallErrorRate =
    totalToolCalls === 0 ? 0 : totalToolErrors / totalToolCalls;

  const guardrailViolations = runs.reduce(
    (sum, run) => sum + run.guardrailViolations,
    0
  );

  const latencies = runs
    .map((run) => run.durationMs)
    .sort((a, b) => a - b);
  const p50LatencyMs = percentile(latencies, 0.5);
  const p95LatencyMs = percentile(latencies, 0.95);

  return {
    successAtBudget,
    meanStepsToSuccess,
    wastedStepRatio,
    toolCallErrorRate,
    guardrailViolations,
    p50LatencyMs,
    p95LatencyMs,
    totalRuns,
    successfulRuns: successfulRuns.length,
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const index = Math.ceil(values.length * p) - 1;
  return values[Math.max(0, Math.min(index, values.length - 1))];
}

export function printMetrics(
  metrics: AggregateMetrics,
  run?: RunResult
) {
  console.log();
  console.log("==========================");
  console.log("METRICS");
  console.log("==========================");
  console.log(
    `Success@Budget      : ${(metrics.successAtBudget * 100).toFixed(1)}%`
  );
  console.log(
    `Mean Steps (success): ${metrics.meanStepsToSuccess.toFixed(1)}`
  );
  console.log(
    `Wasted Step Ratio   : ${metrics.wastedStepRatio.toFixed(2)}`
  );
  console.log(
    `Tool Error Rate     : ${metrics.toolCallErrorRate.toFixed(2)}`
  );
  console.log(
    `Guardrail Violations: ${metrics.guardrailViolations}`
  );
  console.log(`p50 Latency         : ${metrics.p50LatencyMs} ms`);
  console.log(`p95 Latency         : ${metrics.p95LatencyMs} ms`);

  if (run) {
    console.log(
      `Steps Used          : ${run.steps}/${run.maxSteps}`
    );
    console.log(`Latency (run)       : ${run.durationMs} ms`);
  }
}

export function formatMetricsTable(
  label: string,
  metrics: AggregateMetrics
): string {
  return [
    label,
    `${(metrics.successAtBudget * 100).toFixed(1)}%`,
    metrics.meanStepsToSuccess.toFixed(1),
    metrics.wastedStepRatio.toFixed(2),
    metrics.toolCallErrorRate.toFixed(2),
    String(metrics.guardrailViolations),
    String(metrics.p50LatencyMs),
    String(metrics.p95LatencyMs),
  ].join(" | ");
}
