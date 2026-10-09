import type { Account } from "./types";

export type Session = { token: string; expiresAt: string; account: Account };
export const sessionKey = "tasktrack.session";

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const value = JSON.parse(window.localStorage.getItem(sessionKey) || "null") as Session | null;
    if (!value || typeof value.token !== "string" || !Number.isFinite(Date.parse(value.expiresAt)) || !value.account || !Number.isInteger(value.account.accountId) || ![0, 1].includes(value.account.role)) return null;
    return value;
  } catch { return null; }
}
export function saveSession(value: Session) { window.localStorage.setItem(sessionKey, JSON.stringify(value)); }
export function clearSession() { if (typeof window !== "undefined") window.localStorage.removeItem(sessionKey); }
