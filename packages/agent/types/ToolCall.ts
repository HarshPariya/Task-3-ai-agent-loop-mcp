export interface ToolCall {
  id: string;

  name:
    | "read_file"
    | "list_dir"
    | "grep"
    | "propose_edit"
    | "run_test";

  arguments: Record<string, any>;
}