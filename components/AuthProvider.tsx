"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, json, refreshSession } from "@/lib/api";
import { clearSession, readSession, saveSession, type Session } from "@/lib/session";
import type { Account } from "@/lib/types";

type AuthState = { account: Account | null; loading: boolean; signIn: (session: Session) => void; logout: () => void };
const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const restoreRequest = useRef<AbortController | null>(null);
  const signIn = useCallback((value: Session) => { restoreRequest.current?.abort(); saveSession(value); setSession(value); setLoading(false); }, []);
  // A full navigation clears in-memory auth and avoids the protected layout racing the home redirect.
  const logout = useCallback(async () => {
    restoreRequest.current?.abort();
    const cached = readSession();
    clearSession();
    try { if (cached?.refreshToken) await api("/auth/logout", { ...json({ refreshToken: cached.refreshToken }), signal: AbortSignal.timeout(10000) }); }
    catch { /* Local logout still completes if the backend is unreachable. */ }
    finally { window.location.replace("/"); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    restoreRequest.current = controller;
    async function restore() {
      try {
        let cached = readSession();
        if (cached && Date.parse(cached.expiresAt) <= Date.now()) cached = await refreshSession(cached.token);
        if (cached) {
          const account = await api<Account>("/auth/me", { signal: controller.signal });
          const latest = readSession();
          if (!controller.signal.aborted && latest) { const value = { ...latest, account }; saveSession(value); setSession(value); }
        } else clearSession();
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") { clearSession(); setSession(null); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void restore();
    const expired = () => { restoreRequest.current?.abort(); clearSession(); setSession(null); setLoading(false); router.replace("/login"); };
    const renewed = () => { setSession(readSession()); };
    const storage = (event: StorageEvent) => { if (event.key === "tasktrack.session") { restoreRequest.current?.abort(); setSession(readSession()); setLoading(false); } };
    window.addEventListener("session-expired", expired);
    window.addEventListener("storage", storage);
    window.addEventListener("session-refreshed", renewed);
    return () => { controller.abort(); window.removeEventListener("session-expired", expired); window.removeEventListener("storage", storage); window.removeEventListener("session-refreshed", renewed); };
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => { void refreshSession(session.token).catch(() => window.dispatchEvent(new Event("session-expired"))); }, Math.max(0, Date.parse(session.expiresAt) - Date.now() - 30000));
    return () => window.clearTimeout(timer);
  }, [session]);
  const value = useMemo(() => ({ account: session?.account ?? null, loading, signIn, logout }), [session, loading, signIn, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("AuthProvider is required."); return value; }
