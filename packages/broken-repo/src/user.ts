import { formatName } from "./helper";
export function getGreeting(first: string, last: string): string {
  return `Hello, ${formatName(first, last)}!`;
}
