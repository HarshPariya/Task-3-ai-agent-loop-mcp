import { AgentState } from "../types/AgentState";

export const DEFAULT_MAX_STEPS = 12;

export function createInitialState(
  test: string,
  maxSteps = DEFAULT_MAX_STEPS
): AgentState {
  return {
    currentTest: test,
    currentTestOutput: "",

    currentStep: 0,
    maxSteps,

    seenFiles: [],
    seenDirectories: [],

    fileContents: {},

    plan: [],

    history: [],

    completed: false,
  };
}