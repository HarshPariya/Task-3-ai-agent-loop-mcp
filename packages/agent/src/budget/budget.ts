export interface BudgetLimits {
  maxCostUSD: number;
  maxDurationMs: number;
}

export class BudgetManager {
  private readonly startedAt: number;
  private totalCost = 0;

  constructor(private readonly limits: BudgetLimits) {
    this.startedAt = Date.now();
  }

  addCost(cost: number): void {
    this.totalCost += cost;
  }

  getCurrentCost(): number {
    return this.totalCost;
  }

  getElapsedTime(): number {
    return Date.now() - this.startedAt;
  }

  check(): void {
    if (this.totalCost > this.limits.maxCostUSD) {
      throw new Error(
        `Budget exceeded: Cost limit reached (${this.totalCost.toFixed(6)} USD)`
      );
    }

    if (this.getElapsedTime() > this.limits.maxDurationMs) {
      throw new Error(
        `Budget exceeded: Time limit reached (${this.getElapsedTime()} ms)`
      );
    }
  }

  reset(): void {
    this.totalCost = 0;
  }
}