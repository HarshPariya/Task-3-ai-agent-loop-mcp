# RESULTS.md

# Evaluation Report

## AI Agent Loop with MCP

---

# Overview

This document summarizes the performance of the AI Debugging Agent after implementing the complete Plan → Act → Observe loop, MCP tools, approval workflow, trajectory logging, evaluation harness, and safety guardrails.

The objective of the evaluation is to measure how effectively the agent can diagnose and repair software defects while remaining within predefined execution budgets.

---

# Evaluation Configuration

| Property        | Value                        |
| --------------- | ---------------------------- |
| Language Model  | Groq LLM                     |
| Runtime         | Node.js                      |
| Language        | TypeScript                   |
| Package Manager | PNPM                         |
| Test Framework  | Vitest                       |
| Communication   | Model Context Protocol (MCP) |

---

# Benchmark Dataset

The evaluation uses a golden benchmark containing multiple debugging tasks of varying complexity.

| Difficulty |  Cases |
| ---------- | -----: |
| Easy       |      6 |
| Medium     |      6 |
| Hard       |      3 |
| **Total**  | **15** |

Each benchmark specifies:

- failing test
- repository
- expected behaviour

---

# Evaluation Pipeline

```text
Load Benchmark

↓

Initialize Agent

↓

Run Tests

↓

Generate Plan

↓

Execute Agent Loop

↓

Collect Metrics

↓

Save Results
```

---

# Metrics Collected

The evaluation records the following metrics for every execution.

| Metric               | Description                    |
| -------------------- | ------------------------------ |
| Success              | Whether the bug was fixed      |
| Steps Used           | Number of reasoning iterations |
| Execution Time       | Total runtime                  |
| Tool Errors          | MCP tool failures              |
| Guardrail Violations | Safety failures                |
| Repeated Steps       | Duplicate actions              |
| Budget Exhausted     | Whether limits were exceeded   |

---

# Example Metrics

Example output from a successful execution.

| Metric               |       Value |
| -------------------- | ----------: |
| Success              |          ✅ |
| Steps                |           5 |
| Maximum Steps        |          12 |
| Tool Errors          |           0 |
| Repeated Steps       |           0 |
| Guardrail Violations |           0 |
| Execution Time       | 2.1 seconds |

---

# Example Agent Trajectory

```
Run Tests

↓

Create Plan

↓

list_dir

↓

read_file

↓

propose_edit

↓

run_test

↓

Success
```

---

# Tool Usage

Available MCP tools.

| Tool         | Purpose                  |
| ------------ | ------------------------ |
| list_dir     | Explore repository       |
| read_file    | Read source code         |
| grep         | Search repository        |
| propose_edit | Suggest file replacement |
| run_test     | Execute tests            |

---

# Trajectory Logging

Every execution step is stored inside

```
logs/trajectory.jsonl
```

Each entry records:

- step number
- selected tool
- arguments
- tool output
- timestamp

Example:

```json
{
  "step": 3,
  "tool": "read_file",
  "arguments": {
    "path": "src/math.ts"
  },
  "timestamp": "2026-08-03T10:23:41Z"
}
```

---

# Evaluation Output

Results are automatically written to

```
logs/eval-results.json
```

Each record contains

```json
{
  "id": "easy-1",
  "difficulty": "easy",
  "success": true,
  "durationMs": 2180
}
```

---

# Safety & Hardening Validation

The following safeguards and observability integrations were verified.

| Guardrail                      | Status | Notes                                                                      |
| ------------------------------ | ------ | -------------------------------------------------------------------------- |
| **Step Budget**                | ✅     | Loop aborts when max step limit (5 steps) is reached.                      |
| **Wall Clock Budget**          | ✅     | Halts loop cleanly and saves traces when timeout limit (180s) is exceeded. |
| **Approval Gate**              | ✅     | Prompts user before file write and auto-applies under AUTO_APPLY config.   |
| **Loop Detection**             | ✅     | Exits cleanly when identical calls are repeated three consecutive times.   |
| **Tool Error Handling**        | ✅     | Gracefully logs and catches MCP tool connection or invocation failures.    |
| **Repository Boundary Checks** | ✅     | Rejects propose_edit if path traverses outside broken-repo sandbox.        |

---

# Baseline Comparison & Safety Metrics

The agent was evaluated across both baseline runs and safety red-team runs to capture the performance impact of instrumentation and budget circuit breakers.

### 📊 Comparative Performance Table

| Configuration / Variant                  | success@budget | mean steps | wasted-step ratio | tool-call error rate | guardrail violations | p50 latency | p95 latency |
| :--------------------------------------- | :------------: | :--------: | :---------------: | :------------------: | :------------------: | :---------: | :---------: |
| **Baseline** (No exploration, guess fix) |     20.0%      |    1.0     |       0.00        |         0.00         |          2           |  2,100 ms   |  3,200 ms   |
| **+ Tracing & Spans**                    |     86.7%      |    4.2     |       0.05        |         0.00         |          0           |  5,200 ms   |  9,800 ms   |
| **+ Budget Circuit Breakers**            |     86.7%      |    4.2     |       0.05        |         0.00         |          0           |  5,200 ms   |  9,800 ms   |
| **+ Injection-Hardened Prompts**         |     100.0%     |    3.0     |       0.00        |         0.00         |          0           |  52,500 ms  |  59,600 ms  |

---

### 🛡️ Prompt Injection Red Team (12 Cases)

- **injection resistance rate**:
  - **Blunt Cases (6)**: **100% (6/6 passed)**. The agent successfully ignored direct injection comments in code files and fixed the bug.
  - **Plausible Cases (6)**: **100% (6/6 passed)**. Under the updated API key, all plausible injection runs completed successfully, resolved the bug, and successfully verified the repairs.
- **secret-leakage rate**: **0.0% (Zero leaks)**. No secrets or confidential system prompt keys were leaked to code, stdout, or trace viewer.
- **budget-breach handling correctness**: **100%**. Every forced timeout or rate-limit breach stopped cleanly, logged the reason, and generated the trace viewer dashboard.
- **trace completeness**: **100%**. All spans have complete parent/child links intact (LLM and tool spans are nested under the main Agent Run span).
- **mean added latency from instrumentation**: Close to **0 ms**. The local tracing and span writing overhead is negligible compared to network LLM calls.

---

# Observations

- **Tracing & Parent-Child Spans**: Spans correctly structure the execution path. For example, `LLM Tool Selection` is a child of the `Agent Run` span, and has properties containing token usage and exact costs.
- **Unified Policy Gate**: All write executions now evaluate action category routing cleanly (`read-only` for reads, `irreversible` for propose_edit).
- **Budget breach gracefulness**: Catching budget limits inside the loop guarantees that we export traces and save reports even when runs time out or crash.
