# Changelog

All notable changes to this project are documented here.

This project follows semantic versioning principles where practical.

---

# v1.0.0 — Final Submission

## Added

- Complete autonomous AI debugging agent
- MCP Server integration
- MCP Client
- Planning module
- Tool selection using Groq
- Agent execution loop
- Human approval workflow
- Trajectory logging
- Evaluation harness
- CLI interface
- Metrics collection
- Golden benchmark support
- Repository caching
- File caching
- Directory caching

---

## Implemented Tools

- read_file
- list_dir
- grep
- propose_edit
- run_test

---

## Safety Features

- Step Budget
- Wall Clock Budget
- Stuck Loop Detection
- Repository Boundary Validation
- Human Approval
- Tool Error Tracking

---

## Logging

Added

- trajectory.jsonl
- eval-results.json

---

## Evaluation

Added benchmark runner supporting

- Easy cases
- Medium cases
- Hard cases

---

## Documentation

Created

- README.md
- DESIGN.md
- NOTES.md
- RESULTS.md
- CHANGELOG.md

---

## CLI

Added commands

```bash
pnpm agent fix --test tests/math.test.ts

pnpm agent eval

pnpm agent eval --live

pnpm agent eval --compare baseline.json
```

---

## Status

Final Assignment Submission

Version: 1.0.0

---

# v1.1.0 — Observability & Safety Hardening

## Added

- Structured tracing with parent-child span trees (`packages/agent/src/tracing/`)
- `Tracer` class with JSON export to `generated/traces/trace.json`
- HTML flame-graph trace viewer (`packages/agent/src/viewer/viewer.ts`)
- Per-run history snapshots (`generated/history/`)
- Per-run markdown reports (`generated/reports/`)
- Budget circuit breakers — cost ceiling ($0.05) and wall-clock ceiling (180s)
- `BudgetManager` class (`packages/agent/src/budget/budget.ts`)
- Unified human-in-the-loop policy table (`packages/agent/src/policy/policy.ts`)
- Prompt-injection red team — 12 adversarial cases
- `evals/injection-redteam.jsonl` dataset
- Security evaluation runner (`packages/agent/src/security/`)
- `pnpm security` CLI command
- Input redaction for API keys and target secrets in trace spans
- Golden eval trace snapshots (`generated/golden/traces/`)
- Security eval trace snapshots (`generated/security/traces/`)

---

## Changed

- `runLoop.ts` now instruments every LLM and tool call with spans
- `model.ts` exports token counts and cost estimates per LLM call
- `model.ts` redacts sensitive values before trace logging
- Approval gate integrated with `HumanApprovalPolicy` action categories
- Budget checks run every loop iteration, independent of step count
- `README.md`, `DESIGN.md`, `NOTES.md`, `RESULTS.md`, `SECURITY.md` updated
- `.gitignore` expanded with comprehensive ignore patterns

---

## Security Eval Results

| Category | Pass Rate |
| -------- | --------- |
| Blunt (6 cases) | 100% (6/6) |
| Plausible (6 cases) | 100% (6/6) |
| Secret leakage | 0% (zero leaks) |
| Budget breach handling | 100% clean stops |

---

## New CLI

```bash
pnpm security          # Run 12-case prompt-injection red team
pnpm agent fix --test tests/math.test.ts   # Agent run with tracing
```

---

## Documentation

Updated:

- README.md — observability, safety, updated project structure
- DESIGN.md — Section 15: span schema, policy table, tracing architecture
- NOTES.md — tracing, budget, red team, reproduction steps
- RESULTS.md — comparative table, mitigation analysis, reproduction
- SECURITY.md — redaction policy, reproduction steps
- .gitignore — dependencies, secrets, logs, build outputs

Version: 1.1.0
