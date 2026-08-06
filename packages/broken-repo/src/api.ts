import { buildUrl } from "./api-helper";
export function fetchUser(): string {
  return buildUrl("users/1");
}
