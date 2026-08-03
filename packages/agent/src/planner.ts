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
        content: prompt,
      },
    ],
  });

  try {
    const content =
      response.choices[0].message.content ?? "[]";

    return JSON.parse(content);
  } catch {
    return [
      "Inspect project",
      "Read source code",
      "Fix bug",
      "Run tests",
    ];
  }
}