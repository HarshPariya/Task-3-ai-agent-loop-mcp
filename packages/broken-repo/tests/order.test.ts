import { describe, expect, it } from "vitest";
import { finalPrice } from "../src/order";
describe("Order final price", () => {
  it("applies discount", () => {
    expect(finalPrice(100, 5)).toBe(90);
  });
});
