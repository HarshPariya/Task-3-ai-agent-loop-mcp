import { calculateTax } from "./cart-util";
export function getTotal(price: number): number {
  return price + calculateTax(price);
}
