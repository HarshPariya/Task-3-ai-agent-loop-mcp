export type ActionCategory =
  | "read-only"
  | "reversible-write"
  | "irreversible"
  | "external";

export interface PolicyResult {
  allowed: boolean;
  requiresApproval: boolean;
  message: string;
}

export class HumanApprovalPolicy {
  evaluate(action: ActionCategory): PolicyResult {
    switch (action) {
      case "read-only":
        return {
          allowed: true,
          requiresApproval: false,
          message: "Read-only action. Logged for trace completeness."
        };

      case "reversible-write":
        return {
          allowed: true,
          requiresApproval: false,
          message: "Reversible write allowed within policy."
        };

      case "irreversible":
        return {
          allowed: false,
          requiresApproval: true,
          message: "Explicit human approval required."
        };

      case "external":
        return {
          allowed: false,
          requiresApproval: true,
          message: "External action requires explicit human approval."
        };

      default:
        return {
          allowed: false,
          requiresApproval: true,
          message: "Unknown action. Approval required."
        };
    }
  }
}