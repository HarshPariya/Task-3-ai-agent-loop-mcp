# NOTES.md

# Engineering Notes

## AI Agent Loop with MCP

---

# Project Goal

The objective of this project was to build an autonomous AI debugging agent capable of identifying failing tests, exploring a repository through MCP tools, proposing safe code modifications, and validating fixes through automated testing.

Rather than giving the language model unrestricted filesystem access, every interaction is mediated through the **Model Context Protocol (MCP)**. This improves safety, modularity, and reproducibility.

---

# Major Design Decisions

## 1. Plan Before Acting

Instead of allowing the language model to immediately select tools, the agent first generates a debugging plan.

Example:

```
Locate source file

↓

Read implementation

↓

Identify defect

↓

Modify file

↓

Run tests
```

### Why?

Planning improves consistency and reduces unnecessary exploration. It also makes the agent's behaviour easier to understand and debug.

---

## 2. One Tool per Iteration

The agent is restricted to selecting exactly one MCP tool during each iteration.

### Benefits

- easier reasoning
- deterministic execution
- simpler trajectory logs
- improved debugging

---

## 3. Repository Access Through MCP

The language model never interacts with repository files directly.

Instead it uses:

- read_file
- list_dir
- grep
- propose_edit
- run_test

### Why?

This provides a controlled interface between reasoning and execution.

Benefits include:

- safety
- modularity
- clear permissions
- reusable architecture

---

## 4. Human Approval

Every file modification follows the same pipeline.

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

### Why?

This prevents accidental or unsafe repository modifications and keeps the human user in control.

---

## 5. Cached Repository State

Previously inspected files are stored in memory.

The agent avoids reading the same file repeatedly.

### Benefits

- fewer tool calls
- reduced latency
- lower token usage
- more efficient reasoning

---

# Challenges Encountered

## Challenge 1

### Infinite Tool Loops

Initially the language model repeatedly selected identical tools.

Example:

```
read_file

↓

read_file

↓

read_file
```

### Solution

A stuck-loop detector was implemented.

The agent now terminates if the same tool with identical arguments is selected three consecutive times.

---

## Challenge 2

### Unlimited Runtime

Without execution limits, the agent could continue reasoning indefinitely.

### Solution

Implemented:

- Step Budget
- Wall Clock Budget

Execution now stops safely after reaching configured limits.

---

## Challenge 3

### Unsafe File Modifications

Early implementations allowed unrestricted file replacement.

### Solution

Added an approval system with validation.

Invalid edits are rejected before writing.

---

## Challenge 4

### Duplicate Repository Reads

The language model frequently revisited files already inspected.

### Solution

Introduced:

- seenFiles
- seenDirectories
- cached file contents

This significantly reduced redundant operations.

---

## Challenge 5

### Evaluation Automation

Running multiple benchmark cases manually was inefficient.

### Solution

Implemented an evaluation harness capable of executing the complete benchmark suite automatically.

---

## Challenge 6

### MCP Stdio Stream Corruption (Stdout Logging)

**Problem**: The MCP server initialization logged messages directly to `stdout` (`console.log`). Because Stdio transport uses `stdout` for JSON-RPC protocol frames, this non-JSON output corrupted the transport stream, causing the client to immediately close the connection upon launch.

**Solution**: Redirected all server startup logs, warnings, and diagnostic information to `stderr` (e.g. `console.error`). The Stdio transport channel ignores `stderr` output, preventing protocol stream corruption.

---

## Challenge 7

### Interactive Prompt Stalling in Subprocesses (MCP Timeout)

**Problem**: The `propose_edit` tool originally prompted the user for confirmation inside the MCP server subprocess via `readline`. Since the subprocess's stdio streams are piped to the client for JSON-RPC communication, the prompt blocked the connection, resulting in a request timeout (`McpError: MCP error -32001: Request timed out`).

**Solution**: Moved the approval gate prompting and file writing logic to the parent client process (`runLoop.ts`). The MCP server subprocess now only validates path boundaries and returns a validated status, while the parent process prompts the user and writes the verified diff via its own terminal-facing stdin/stdout.

---

# Guardrails

The final implementation includes multiple safety mechanisms.

## Step Budget

Stops execution after the configured maximum number of iterations.

Purpose:

Prevent infinite reasoning.

---

## Wall Clock Budget

Stops execution after the configured runtime limit.

Purpose:

Prevent hanging processes.

---

## Approval Validation

Ensures repository modifications remain safe.

Checks include:

- repository boundaries
- invalid paths
- protected directories

---

## Stuck Loop Detection

Stops execution if identical actions are repeated continuously.

Purpose:

Prevent repetitive LLM behaviour.

---

# Why MCP Instead of Direct Function Calls?

Traditional function calling tightly couples the language model with repository logic.

Using MCP introduces a clean separation.

Advantages include:

- standardized tool interface
- reusable architecture
- safer repository access
- independent tool implementations
- easier testing

---

# Lessons Learned

Developing autonomous agents involves more than selecting an LLM.

Reliable systems require:

- planning
- memory
- structured tool usage
- validation
- execution limits
- logging
- evaluation

The quality of the surrounding system architecture often has a greater impact than the language model itself.

---

# Limitations

Current implementation supports:

- single repository
- sequential tool execution
- one active debugging task
- manual approval workflow

The language model does not maintain persistent memory across sessions.

---

# Future Improvements

Potential enhancements include:

## Multi-file Editing

Allow coordinated modifications across multiple files.

---

## Retrieval-Augmented Planning

Retrieve repository context before generating a debugging plan.

---

## Parallel Tool Execution

Independent repository operations could execute concurrently.

---

## Persistent Memory

Remember previous debugging sessions.

---

## Cost-Aware Planning

Optimize tool usage to minimize LLM cost.

---

## Automatic Retry Policies

Recover automatically from transient tool failures.

---

## Multi-Agent Collaboration

Separate specialized agents for:

- planning
- debugging
- validation
- testing

---

# Conclusion

This project demonstrates that combining structured planning, controlled repository access, human approval, execution guardrails, and comprehensive evaluation produces a significantly more reliable AI debugging agent than relying on unrestricted language model reasoning alone.

The implementation emphasizes safety, reproducibility, and maintainability while remaining modular and extensible for future improvements.