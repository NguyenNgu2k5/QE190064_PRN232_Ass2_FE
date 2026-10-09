"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
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
  const logout = useCallback(() => { restoreRequest.current?.abort(); clearSession(); window.location.replace("/"); }, []);

  useEffect(() => {
    const controller = new AbortController();
    restoreRequest.current = controller;
    async function restore() {
      const cached = readSession();
      try {
        if (cached && Date.parse(cached.expiresAt) > Date.now()) {
          const account = await api<Account>("/auth/me", { signal: controller.signal });
          if (!controller.signal.aborted) { const value = { ...cached, account }; saveSession(value); setSession(value); }
        } else clearSession();
      } catch (cause) {
        if ((cause as Error).name !== "AbortError") { clearSession(); setSession(null); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void restore();
    const expired = () => { restoreRequest.current?.abort(); clearSession(); setSession(null); setLoading(false); router.replace("/login"); };
    const storage = (event: StorageEvent) => { if (event.key === "tasktrack.session" && !event.newValue) { restoreRequest.current?.abort(); setSession(null); setLoading(false); } };
    window.addEventListener("session-expired", expired);
    window.addEventListener("storage", storage);
    return () => { controller.abort(); window.removeEventListener("session-expired", expired); window.removeEventListener("storage", storage); };
  }, [router]);

  useEffect(() => {
    if (!session) return;
    const timer = window.setTimeout(() => window.dispatchEvent(new Event("session-expired")), Math.max(0, Date.parse(session.expiresAt) - Date.now()));
    return () => window.clearTimeout(timer);
  }, [session]);
  const value = useMemo(() => ({ account: session?.account ?? null, loading, signIn, logout }), [session, loading, signIn, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("AuthProvider is required."); return value; }
