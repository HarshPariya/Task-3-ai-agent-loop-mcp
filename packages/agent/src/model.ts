import dotenv from "dotenv";
import Groq from "groq-sdk";

import { AgentState } from "../types/AgentState";
import { envFilePath } from "./paths";

dotenv.config({
  path: envFilePath(),
});

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function chooseTool(
  state: AgentState
) {
  const history = state.history
    .map((item, index) => {
      return `

Step ${index + 1}

Tool:
${item.call.name}

Arguments:
${JSON.stringify(item.call.arguments, null, 2)}

Result:
${item.result.output}

`;
    })
    .join("\n");

  const cachedFiles =
    Object.keys(state.fileContents).length
      ? Object.entries(state.fileContents)
        .map(
          ([filePath, content]) => `

File:
${filePath}

Content:

${content}

`
        )
        .join("\n-----------------------------\n")
      : "None";

  const plan =
    state.plan.length > 0
      ? state.plan
        .map(
          (step, index) =>
            `${index + 1}. ${step}`
        )
        .join("\n")
      : "No plan created.";

  const prompt = `

You are an expert AI debugging agent.

Current Step:
${state.currentStep}

Maximum Steps:
${state.maxSteps}

=========================
CURRENT PLAN
=========================

${plan}

=========================
FILES ALREADY READ
=========================

${state.seenFiles.length
      ? state.seenFiles.join(", ")
      : "None"
    }

=========================
DIRECTORIES ALREADY LISTED
=========================

${state.seenDirectories.length
      ? state.seenDirectories.join(", ")
      : "None"
    }

=========================
CACHED FILE CONTENTS
=========================

${cachedFiles}

=========================
PREVIOUS ACTIONS
=========================

${history || "None"}

=========================
CURRENT TEST FAILURE
=========================

${state.currentTestOutput}

=========================
RULES
=========================

- Follow the debugging plan.
- Never read the same file twice.
- Never list the same directory twice.
- If a file exists in the cache, NEVER call read_file again.
- Use cached file contents instead.
- Only inspect files that are necessary.
- After identifying the bug, call propose_edit.
- After propose_edit, immediately call run_test.
- Choose EXACTLY ONE TOOL.
- Do not explain your reasoning.

`;

  const response =
    await groq.chat.completions.create({
      model: process.env.MODEL_NAME!,
      temperature: 0,

      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],

      tools: [
        {
          type: "function",
          function: {
            name: "read_file",
            description:
              "Read the contents of a source file.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description:
                    "Relative file path.",
                },
              },
              required: ["path"],
            },
          },
        },

        {
          type: "function",
          function: {
            name: "list_dir",
            description:
              "List files inside a directory.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description:
                    "Relative directory path.",
                },
              },
            },
          },
        },

        {
          type: "function",
          function: {
            name: "grep",
            description:
              "Search for a pattern inside files.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                },
                pattern: {
                  type: "string",
                },
              },
              required: [
                "path",
                "pattern",
              ],
            },
          },
        },

        {
          type: "function",
          function: {
            name: "propose_edit",
            description:
              "Propose a complete replacement for a file.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description:
                    "File to modify.",
                },
                content: {
                  type: "string",
                  description:
                    "Complete replacement file.",
                },
              },
              required: [
                "path",
                "content",
              ],
            },
          },
        },

        {
          type: "function",
          function: {
            name: "run_test",
            description:
              "Run the project's test suite after editing.",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        },
      ],

      tool_choice: "auto",
    });

  return response.choices[0].message.tool_calls?.[0];
}