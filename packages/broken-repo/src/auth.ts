import { CONFIG } from "./config";
export function isAdmin(): boolean {
  return CONFIG.role === "admin";
}
