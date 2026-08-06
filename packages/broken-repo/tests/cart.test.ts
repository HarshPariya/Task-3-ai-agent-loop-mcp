import { describe, expect, it } from "vitest";
import { getTotal } from "../src/cart";
describe("Cart total", () => {
  it("calculates total with tax", () => {
    expect(getTotal(100)).toBe(110);
  });
});
