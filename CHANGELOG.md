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
