import { clearSession, readSession, saveSession, type Session } from "./session";
const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5102/api").replace(/\/$/, "");
const publicAuth = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];
let refreshInFlight: Promise<Session | null> | null = null;

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}

function expire() {
  clearSession();
  if (typeof window !== "undefined") window.dispatchEvent(new Event("session-expired"));
}

export function refreshSession(previousToken = readSession()?.token): Promise<Session | null> {
  if (refreshInFlight) return refreshInFlight;
  async function rotate() {
    const cached = readSession();
    if (!cached) return null;
    if (cached.token !== previousToken) return cached;
    if (!cached.refreshToken) { expire(); return null; }
    const response = await fetch(baseUrl + "/auth/refresh", { ...json({ refreshToken: cached.refreshToken }), headers: { "Content-Type": "application/json" }, cache: "no-store" });
    if (!response.ok) { expire(); throw new ApiError("Session expired. Sign in again.", response.status); }
    const value = await response.json() as Session;
    // A logout or another login while the request was pending must win over its response.
    if (readSession()?.refreshToken !== cached.refreshToken) return readSession();
    saveSession(value);
    window.dispatchEvent(new Event("session-refreshed"));
    return value;
  }
  // Web Locks coalesce rotation across tabs so a legitimate parallel request is not treated as replay.
  const promise = Promise.resolve(typeof navigator !== "undefined" && navigator.locks ? navigator.locks.request("tasktrack-refresh", rotate) : rotate());
  refreshInFlight = promise.finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const session = readSession();
  const send = (token?: string) => {
    const headers = new Headers(init?.headers);
    if (init?.body) headers.set("Content-Type", "application/json");
    if (token) headers.set("Authorization", "Bearer " + token);
    return fetch(baseUrl + path, { ...init, headers, cache: "no-store" });
  };
  let response = await send(session?.token);
  if (response.status === 401 && session && !publicAuth.includes(path)) {
    const renewed = await refreshSession(session.token);
    if (renewed) response = await send(renewed.token);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string; title?: string; errors?: Record<string, string[]> };
    const fields = Object.fromEntries(Object.entries(body.errors || {}).map(([key, values]) => [key.charAt(0).toLowerCase() + key.slice(1), values.join(" ")]));
    if (response.status === 401 && !publicAuth.includes(path)) expire();
    throw new ApiError(body.message || Object.values(fields).join(" ") || body.title || "Request failed (" + response.status + ")", response.status, fields);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const json = (body: unknown, method = "POST"): RequestInit => ({ method, body: JSON.stringify(body) });
