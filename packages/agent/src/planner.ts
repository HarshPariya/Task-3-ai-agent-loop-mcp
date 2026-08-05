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

export async function createPlan(
  state: AgentState
): Promise<string[]> {
  const prompt = `
You are an expert AI debugging agent.

A project's tests are currently failing.

Test Failure:

${state.currentTestOutput}

Your task is to create a short debugging plan.

Rules:

- Return ONLY a JSON array.
- Maximum 6 steps.
- Each step should be short.
- Do not explain anything.
- Do not use markdown.
- Do not repeat steps.
- Every step must be unique.
- Keep steps in execution order.
- Final step should always be "Run tests".

Example:

[
  "Inspect project structure",
  "Read relevant source file",
  "Understand failing test",
  "Fix bug",
  "Run tests"
]
`;

  const response = await groq.chat.completions.create({
    model: process.env.MODEL_NAME!,
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are an expert AI debugging planner.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  try {
    const content =
      response.choices[0].message.content ?? "[]";

    const plan = JSON.parse(content) as string[];

    return [...new Set(plan)].slice(0, 6);
  } catch {
    return [
      "Inspect project",
      "Read source code",
      "Fix bug",
      "Run tests",
    ];
  }
}