# DESIGN.md

# AI Agent Loop with MCP
## Software Design Document

---

# 1. Introduction

## Project Overview

This project implements an autonomous AI debugging agent capable of inspecting source code, understanding test failures, proposing code changes, and validating fixes through automated testing.

The agent follows a **Plan → Act → Observe** architecture and communicates exclusively through a **Model Context Protocol (MCP)** server.

Unlike traditional agents that modify repositories directly, every repository interaction is performed through typed MCP tools, providing strong safety guarantees and a clear separation between reasoning and execution.

---

# 2. Objectives

The primary goals of the system are:

- Execute an autonomous debugging loop
- Support structured planning before execution
- Restrict repository access through MCP tools
- Require explicit approval before applying edits
- Prevent infinite execution
- Record every reasoning step
- Evaluate performance using a benchmark suite

---

# 3. High-Level Architecture

```text
                     +----------------------+
                     |      CLI Entry       |
                     +----------+-----------+
                                |
                                |
                       createInitialState()
                                |
                                |
                      +---------v---------+
                      |     Agent Loop    |
                      +---------+---------+
                                |
               +----------------+----------------+
               |                                 |
               |                                 |
        Planning Module                    LLM Tool Selection
               |                                 |
               |                                 |
        +------v------+                 +--------v--------+
        |  Planner    |                 |    Groq Model   |
        +-------------+                 +--------+--------+
                                                |
                                                |
                                        Tool Selection
                                                |
                                        +-------v--------+
                                        |   MCP Client   |
                                        +-------+--------+
                                                |
                                                |
                                        +-------v--------+
                                        |   MCP Server   |
                                        +-------+--------+
                                                |
     ----------------------------------------------------------------
     |             |             |              |                    |
 read_file     list_dir        grep      propose_edit         run_test
```

---

# 4. System Components

## 4.1 CLI

Responsible for:

- starting the agent
- parsing commands
- launching evaluation mode
- selecting target test

Input

```
pnpm agent fix --test tests/math.test.ts
```

Output

- initialized agent state

---

## 4.2 Agent State

The agent maintains all execution information inside a single state object.

Fields include

| Field | Purpose |
|--------|----------|
| currentTest | failing test |
| currentStep | current iteration |
| maxSteps | execution budget |
| seenFiles | file cache |
| seenDirectories | directory cache |
| fileContents | cached file contents |
| history | executed tools |
| completed | success flag |

---

## 4.3 Planner

The planner receives the failing test output and generates a concise debugging plan.

Example:

```
1. Locate source file
2. Inspect implementation
3. Identify defect
4. Modify function
5. Run tests
```

Planning occurs only once before the execution loop begins.

---

## 4.4 LLM Decision Module

The language model selects exactly one tool per iteration.

Inputs:

- debugging plan
- current state
- cached files
- history
- test output

Output:

One MCP tool call.

---

## 4.5 MCP Client

Acts as the communication layer between the agent and the MCP server.

Responsibilities:

- send tool requests
- receive responses
- normalize tool output

---

## 4.6 MCP Server

Provides controlled repository access.

Available tools:

| Tool | Description |
|-------|-------------|
| read_file | Read source code |
| list_dir | Explore folders |
| grep | Search repository |
| propose_edit | Request file modification |
| run_test | Execute test suite |

The agent never accesses repository files directly.

---

## 4.7 Approval Module

The approval system ensures safe repository modifications.

Pipeline:

```
LLM

↓

propose_edit

↓

validateEdit()

↓

showDiff()

↓

User Approval

↓

applyEdit()
```

Rejected edits are discarded immediately.

---

## 4.8 Metrics Module

Collects runtime statistics.

Reported metrics:

- Success
- Total Steps
- Tool Errors
- Guardrail Violations
- Execution Time
- Repeated Steps

---

## 4.9 Evaluation Harness

Runs the agent against a benchmark dataset.

Dataset:

| Difficulty | Cases |
|------------|------:|
| Easy | 6 |
| Medium | 6 |
| Hard | 3 |

Total

15 benchmark tasks.

---

# 5. Agent Execution Flow

```text
Start

↓

Run Tests

↓

Tests Passing?

├── Yes → Stop

└── No

↓

Generate Plan

↓

Choose Tool

↓

Execute Tool

↓

Observe Result

↓

Update State

↓

Need Another Step?

├── Yes → Continue

└── No

↓

Run Tests

↓

Tests Pass?

├── Yes → Success

└── No

↓

Repeat
```

---

# 6. State Machine

```text
INITIAL

↓

TESTING

↓

PLANNING

↓

TOOL_SELECTION

↓

TOOL_EXECUTION

↓

STATE_UPDATE

↓

TESTING

↓

SUCCESS

or

FAILED
```

---

# 7. Safety Mechanisms

## Step Budget

Stops execution after the configured maximum number of iterations.

Purpose:

Prevent infinite reasoning.

---

## Wall Clock Budget

Terminates execution after a maximum runtime.

Purpose:

Avoid hanging processes.

---

## Stuck Loop Detection

If the same tool with identical arguments is selected three consecutive times, execution terminates.

Purpose:

Prevent repetitive LLM behaviour.

---

## Approval Validation

Every edit is validated before being written.

Checks include:

- repository boundaries
- restricted folders
- invalid paths

---

# 8. Repository Access Model

Repository interaction is intentionally restricted.

The language model cannot:

- open files directly
- modify files directly
- execute shell commands

Instead, all interactions occur through MCP.

Advantages:

- reproducibility
- safety
- auditability

---

# 9. Logging

Each iteration records:

- tool
- arguments
- timestamp
- result

Output:

```
logs/

trajectory.jsonl
```

This enables replay and debugging.

---

# 10. Evaluation Pipeline

```text
Evaluation Runner

↓

Load Dataset

↓

Execute Case

↓

Collect Metrics

↓

Store Results

↓

Generate Summary
```

Output:

```
logs/eval-results.json
```

---

# 11. Design Decisions

## Why MCP?

MCP provides:

- structured interfaces
- clear tool boundaries
- reusable architecture
- improved safety

compared to unrestricted file access.

---

## Why Planning First?

Planning reduces unnecessary exploration and improves tool efficiency.

---

## Why Cache Files?

Avoids repeated file reads.

Benefits:

- fewer LLM calls
- lower latency
- reduced token usage

---

## Why Approval Gate?

Ensures the user remains in control of repository modifications.

---

## Why Tool History?

History allows:

- context preservation
- trajectory logging
- loop detection
- evaluation

---

# 12. Future Improvements

Possible extensions:

- multi-file editing
- semantic repository search
- retrieval augmented planning
- parallel tool execution
- automatic retry strategies
- multi-agent collaboration
- persistent memory
- distributed execution

---

# 13. Safety & Design Constraints

## The Three Most Likely Failure Modes & Plan for Each

### Failure Mode 1: Infinite Loops & Repetitive LLM Actions
- **Risk**: The language model gets stuck in a loop retrying the same failed action or reading the same files.
- **Plan**: Implement a strict stuck-loop detector. If the same tool call with the identical arguments is chosen three consecutive times, the loop aborts immediately without executing the third call.

### Failure Mode 2: Unsafe Repository Modifications (Path Traversal/Harness Tampering)
- **Risk**: The LLM attempts to perform path traversal (`../`), edit the agent loop codebase, or alter `node_modules`.
- **Plan**: Implement an approval gate with a separate, non-LLM validation check (`validateEditPath`). Every edit proposed must be verified to exist within the repository under test. Any violation will fail loudly and abort the run immediately as a safety failure.

### Failure Mode 3: Stdio Channel Blockage & Hangs
- **Risk**: Opening interactive stdin/stdout prompts inside the MCP server subprocess blocks the JSON-RPC communication channel, causing timeouts.
- **Plan**: Move all interactive user prompts and final file writing to the client process (`runLoop.ts`). The MCP server remains completely non-blocking, returning proposals that are validated, prompted, and written by the client harness.

## What is Deliberately Not Building (and Why)
- **Multi-File Synchronization**: Coordinating edits across multiple files is omitted to keep the tool surface simple and robust. The golden evaluation cases are solvable by editing a single file.
- **Semantic Code Search**: Advanced vector search or codebase parsing is omitted. The standard `grep` and `list_dir` tools are sufficient and less resource-intensive.
- **Session Persistence**: Memory is not shared between test runs to ensure each evaluation case is executed in isolation for reproducibility.

## Open Questions
- *How should the system handle environment variables required by Vitest?* We inherit the parent process environment variables to ensure local config (such as API keys) propagates naturally to subprocesses.
- *Should edits to test files be completely banned?* A blanket ban is not applied because some test cases in the golden set have incorrect assertions that need fixing.

---

# 14. Conclusion

The project demonstrates a complete implementation of an AI debugging agent using the Model Context Protocol.

The architecture emphasizes:

- modularity
- safety
- observability
- reproducibility
- evaluation

The resulting system is suitable for autonomous debugging tasks while maintaining human oversight through explicit approval workflows.