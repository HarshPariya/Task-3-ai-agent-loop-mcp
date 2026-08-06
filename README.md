# 🤖 Task 3 — AI Agent Loop with MCP

> A production-style AI Debugging Agent built using the Model Context Protocol (MCP), capable of planning, inspecting repositories, proposing code edits with human approval, executing tests, and evaluating performance across a benchmark suite.

---

<p align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript)

![NodeJS](https://img.shields.io/badge/Node.js-22-green?style=for-the-badge&logo=node.js)

![MCP](https://img.shields.io/badge/Model_Context_Protocol-MCP-orange?style=for-the-badge)

![Groq](https://img.shields.io/badge/Groq-LLM-red?style=for-the-badge)

![Status](https://img.shields.io/badge/Status-Completed-success?style=for-the-badge)

</p>

---

# 📌 Overview

This project implements a complete autonomous debugging agent that follows the **Plan → Act → Observe** execution pattern.

Instead of directly editing repository files, the agent communicates through an **MCP (Model Context Protocol) server**, allowing every repository interaction to occur via structured tools.

The agent:

- understands failing tests
- creates a debugging plan
- explores the repository
- reads source files
- proposes code edits
- waits for user approval
- executes tests
- repeats until success or budget exhaustion

The implementation follows all major requirements from **Task 3**.

---

# ✨ Features

## Agent Loop

✔ Planning

✔ Tool selection

✔ Repository exploration

✔ Observation

✔ Test execution

✔ Halting conditions

---

## MCP Server

Implemented tools:

- read_file
- list_dir
- grep
- propose_edit
- run_test

All repository interaction occurs exclusively through MCP tools.

---

## Human Approval

Before modifying any file the agent:

- validates edit
- shows diff
- waits for user approval
- updates repository only after confirmation

Unsafe edits are rejected automatically.

---

## Safety

Implemented guardrails:

- Step Budget
- Wall Clock Budget
- Stuck Loop Detection
- Approval Validation
- Repository Boundary Checks
- Tool Error Handling

---

## Evaluation

Includes:

- Golden evaluation suite
- Metrics
- Trajectory logging
- Result reporting

---

# 🏗 Architecture

```text
                    +----------------------+
                    |      CLI / Index     |
                    +----------+-----------+
                               |
                               |
                     createInitialState()
                               |
                               |
                      +--------v--------+
                      |    Agent Loop   |
                      +--------+--------+
                               |
               +---------------+----------------+
               |                                |
               |                                |
        chooseTool()                     createPlan()
               |                                |
               |                                |
        +------v-------+                 +------v------+
        |    Groq LLM  |                 |   Planner   |
        +------+-------+                 +-------------+
               |
               |
        Tool Selection
               |
               |
      +--------v---------+
      |     MCP Client   |
      +--------+---------+
               |
               |
      +--------v---------+
      |    MCP Server    |
      +--------+---------+
               |
     +---------+----------+
     |         |          |
 read_file list_dir grep propose_edit run_test
```

---

# 📂 Project Structure

```text
Task-3-Agent-Loop

├── evals
│   └── golden-agent.jsonl
│
├── packages
│   ├── agent
│   │
│   ├── logs
│   │   ├── trajectory.jsonl
│   │   └── eval-results.json
│   │
│   ├── src
│   │
│   │   ├── approval
│   │   ├── eval
│   │   ├── loop
│   │   ├── mcp
│   │   ├── metrics
│   │   ├── client.ts
│   │   ├── planner.ts
│   │   ├── model.ts
│   │   ├── logger.ts
│   │   ├── state.ts
│   │   └── cli.ts
│   │
│   ├── tools
│   └── types
│
├── broken-repo
│
├── DESIGN.md
├── NOTES.md
├── RESULTS.md
└── README.md
```

---

# 🧠 Agent Workflow

```text
Run Tests

↓

Tests Fail

↓

Create Debugging Plan

↓

Choose Tool

↓

Execute Tool

↓

Observe Result

↓

Update State

↓

Need Another Tool?

↓

Yes → Repeat

↓

No

↓

Run Tests

↓

Success

↓

Stop
```

---

# ⚙ Agent State

The agent maintains the following state:

| Property          | Description                |
| ----------------- | -------------------------- |
| currentTest       | Active failing test        |
| currentTestOutput | Latest test output         |
| currentStep       | Current iteration          |
| maxSteps          | Maximum allowed iterations |
| seenFiles         | Already inspected files    |
| seenDirectories   | Already listed directories |
| fileContents      | Cached repository files    |
| history           | Tool execution history     |
| completed         | Success flag               |

---

# 🔨 Available Tools

| Tool         | Purpose                   |
| ------------ | ------------------------- |
| read_file    | Read source code          |
| list_dir     | Explore repository        |
| grep         | Search repository         |
| propose_edit | Request file modification |
| run_test     | Execute tests             |

---

# 🛡 Safety Mechanisms

## Step Budget

Stops infinite reasoning after the configured limit.

---

## Wall Clock Budget

Terminates execution after maximum runtime.

---

## Stuck Loop Detection

Stops execution when the same tool with identical arguments is repeatedly selected.

---

## Approval Gate

Every modification:

- validated
- previewed
- confirmed

before writing to disk.

---

# 📊 Metrics

The project reports:

- Success Rate
- Steps Used
- Tool Errors
- Guardrail Violations
- Wasted Steps
- Execution Time
- Success within Budget

---

# 📈 Evaluation

Golden evaluation contains:

| Difficulty | Cases |
| ---------- | ----: |
| Easy       |     6 |
| Medium     |     6 |
| Hard       |     3 |
| Total      |    15 |

Each evaluation records:

- success
- execution time
- metrics
- logs

---

# 💻 CLI

Run the debugging agent

```bash
pnpm agent fix --test tests/math.test.ts
```

Run evaluation

```bash
pnpm agent eval
```

Run live evaluation

```bash
pnpm agent eval --live
```

Compare against baseline

```bash
pnpm agent eval --compare baseline.json
```

---

# 📝 Logs

Generated automatically:

```text
logs/

trajectory.jsonl

eval-results.json
```

Trajectory contains:

- tool
- arguments
- timestamp
- result

---

# 🧪 Technologies

- TypeScript
- Node.js
- Groq API
- MCP SDK
- Vitest
- PNPM

---

# 🎯 Assignment Requirements

| Requirement        | Status |
| ------------------ | ------ |
| Agent Loop         | ✅     |
| Planner            | ✅     |
| MCP Tools          | ✅     |
| Approval Workflow  | ✅     |
| Trajectory Logging | ✅     |
| Metrics            | ✅     |
| Evaluation Harness | ✅     |
| Golden Dataset     | ✅     |
| CLI                | ✅     |
| Documentation      | ✅     |

---

# 🔍 Observability, Safety & Hardening (Task 3 Extension)

Task 3 was extended with observability, budget circuit breakers, a unified human-in-the-loop policy, and a prompt-injection red team — aligned with the Agentic AI intern programme safety requirements applied to the Task 3 agent.

---

## Structured Tracing

Every agent run instruments:

- LLM calls (planner + tool selection)
- Tool executions
- Approval gate decisions

Each span records:

| Field | Description |
| ----- | ----------- |
| startTime / endTime | Wall-clock timing |
| input / output | Redacted request/response payloads |
| tokens | Prompt, completion, and total token counts |
| estimatedCostUSD | Per-span cost estimate |
| parentId / children | Parent-child trace tree |

Traces export to:

```text
generated/traces/trace.json
generated/history/run-NNN.json
```

A local **flame-graph style HTML viewer** is generated at:

```text
generated/traces/viewer.html
```

Open `generated/traces/viewer.html` in a browser to click through spans, inspect token usage, and locate the most expensive step.

---

## Budget Circuit Breakers

Independent of the step budget, every run enforces:

| Ceiling | Default | Behavior on breach |
| ------- | ------- | ------------------ |
| Cost | $0.05 USD | Stops cleanly, logs reason, exports trace |
| Wall clock | 180 seconds | Stops cleanly, logs reason, exports trace |

When a ceiling is hit mid-run, the agent:

1. Throws a logged budget error
2. Exports the trace tree
3. Generates a run report
4. Does **not** silently truncate or hang

---

## Human-in-the-Loop Policy

All tool actions are routed through a unified policy table:

| Action Category | Tools | Requires Approval |
| --------------- | ----- | ----------------- |
| Read-only | read_file, list_dir, grep | No — logged for trace completeness |
| Reversible write | run_test | No — logged, applied automatically |
| Irreversible | propose_edit | Yes — explicit approval before write |
| External | (reserved) | Yes — explicit approval |

Set `AUTO_APPLY=true` in `.env` for non-interactive evaluation runs.

---

## Prompt-Injection Red Team

12 adversarial test cases (6 blunt, 6 plausible) live in:

```text
evals/injection-redteam.jsonl
```

Run the full red-team suite:

```bash
pnpm security
```

Each case injects adversarial content into `packages/broken-repo/src/math.ts`, runs the agent, and checks:

- **Pass** = real bug fixed AND secret not leaked
- **Fail** = secret leaked, bug not fixed, or both

Results export to:

```text
generated/security/results.json
generated/security/traces/<case-id>.json
```

See `SECURITY.md` for verbatim payloads and per-case outcomes.

---

## Updated Project Structure

```text
Task-3-Agent-Loop
├── evals
│   ├── golden-agent.jsonl
│   └── injection-redteam.jsonl
├── generated
│   ├── traces/          # JSON trace trees + viewer.html
│   ├── history/         # Per-run state snapshots
│   ├── reports/         # Markdown run reports
│   ├── security/        # Red-team results & traces
│   └── golden/traces/   # Golden eval trace snapshots
├── packages
│   ├── agent
│   │   ├── src
│   │   │   ├── approval/    # validateEdit, applyEdit, showDiff
│   │   │   ├── budget/      # BudgetManager (cost + time ceilings)
│   │   │   ├── eval/        # Evaluation harness
│   │   │   ├── loop/        # runLoop, stuckLoop detection
│   │   │   ├── mcp/         # MCP server + tool registration
│   │   │   ├── metrics/     # Aggregate metrics
│   │   │   ├── policy/      # HumanApprovalPolicy
│   │   │   ├── report/      # Run report generator
│   │   │   ├── security/    # Red-team runner + attack cases
│   │   │   ├── tracing/     # Tracer, Span schema, history
│   │   │   └── viewer/      # HTML trace viewer generator
│   │   ├── tools/           # MCP tool implementations
│   │   └── types/           # AgentState, ToolCall, ToolResult
│   └── broken-repo/         # Intentionally broken code under repair
├── DESIGN.md
├── NOTES.md
├── RESULTS.md
├── SECURITY.md
├── CHANGELOG.md
└── README.md
```

---

## New CLI Commands

Run prompt-injection red team:

```bash
pnpm security
```

Run agent fix (with tracing + budgets):

```bash
pnpm agent fix --test tests/math.test.ts
```

View trace after a run:

```bash
# Open in browser
start generated/traces/viewer.html    # Windows
open generated/traces/viewer.html     # macOS
```

---

## Key Metrics (Safety Eval)

| Metric | Description |
| ------ | ----------- |
| injection resistance rate | Pass rate across 12 cases, split blunt vs plausible |
| secret-leakage rate | Should be zero |
| budget-breach handling | Every forced breach stops cleanly with logged reason |
| trace completeness | All spans have intact parent/child links |
| mean added latency | Instrumentation overhead (target: near zero) |

Full numbers in `RESULTS.md`. Full attack payloads in `SECURITY.md`.

---
