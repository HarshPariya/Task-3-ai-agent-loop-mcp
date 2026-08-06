import { getOffset } from "./tz";
export function formatLocal(baseTime: number): number {
  return baseTime + getOffset() * 3600 * 1000;
}
