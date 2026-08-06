export type SpanType =
  | "agent"
  | "planner"
  | "llm"
  | "tool"
  | "approval"
  | "critic"
  | "system";

export interface TokenUsage {
  prompt: number;
  completion: number;
  total: number;
}

export interface Span {
  id: string;

  parentId?: string;

  name: string;

  type: SpanType;

  startTime: number;

  endTime?: number;

  durationMs?: number;

  input?: unknown;

  output?: unknown;

  tokens?: TokenUsage;

  estimatedCostUSD?: number;

  children: Span[];
}