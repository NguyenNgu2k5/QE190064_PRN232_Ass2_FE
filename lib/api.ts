import { clearSession, readSession } from "./session";
const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5102/api").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message: string, public status: number, public fields: Record<string, string> = {}) { super(message); }
}
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  const session = readSession();
  if (session) headers.set("Authorization", "Bearer " + session.token);
  const response = await fetch(baseUrl + path, { ...init, headers, cache: "no-store" });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string; title?: string; errors?: Record<string, string[]> };
    const fields = Object.fromEntries(Object.entries(body.errors || {}).map(([key, values]) => [key.charAt(0).toLowerCase() + key.slice(1), values.join(" ")]));
    if (response.status === 401 && !["/auth/login", "/auth/register"].includes(path) && typeof window !== "undefined") { clearSession(); window.dispatchEvent(new Event("session-expired")); }
    throw new ApiError(body.message || Object.values(fields).join(" ") || body.title || "Request failed (" + response.status + ")", response.status, fields);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const json = (body: unknown, method = "POST"): RequestInit => ({ method, body: JSON.stringify(body) });
