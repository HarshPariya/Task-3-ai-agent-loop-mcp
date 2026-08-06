import { getDiscount } from "./order-util";
export function finalPrice(price: number, quantity: number): number {
  return price - getDiscount(quantity);
}
