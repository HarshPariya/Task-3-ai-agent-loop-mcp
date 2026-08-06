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
