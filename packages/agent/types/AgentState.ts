import { HistoryItem } from "./HistoryItem";

export interface AgentState {
  currentTest: string;
  currentTestOutput: string;

  currentStep: number;
  maxSteps: number;

  seenFiles: string[];
  seenDirectories: string[];

  fileContents: Record<string, string>;

  plan: string[];

  history: HistoryItem[];

  completed: boolean;
}