"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError, json } from "@/lib/api";
import { validateAuth, type AuthValues } from "@/lib/auth-validation";
import type { Session } from "@/lib/session";
import { useAuth } from "./AuthProvider";
import { Field, Feedback } from "./Field";

export function AuthForm({ mode, registered = false }: { mode: "login" | "register"; registered?: boolean }) {
  const register = mode === "register";
  const router = useRouter();
  const { signIn } = useAuth();
  const [values, setValues] = useState<AuthValues>({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  useEffect(() => { if (Object.keys(errors).length) summary.current?.focus(); }, [errors]);
  const set = (key: keyof AuthValues, value: string) => setValues((current) => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault();
    const validation = validateAuth(values, register);
    setErrors(validation); setError("");
    if (Object.keys(validation).length) return;
    setBusy(true);
    try {
      if (register) {
        await api("/auth/register", json({ fullName: values.fullName.trim(), email: values.email.trim(), password: values.password }));
        router.replace("/login?registered=1");
      } else {
        const session = await api<Session>("/auth/login", json({ email: values.email.trim(), password: values.password }));
        signIn(session);
        router.replace("/admin");
      }
    } catch (cause) {
      setError((cause as Error).message);
      if (cause instanceof ApiError) setErrors(cause.fields);
    } finally { setBusy(false); }
  }
  return <div className="auth-layout"><section className="auth-intro"><p className="eyebrow">YOUR TEAM WORKSPACE</p><h1>{register ? "Start working together." : "Welcome back."}</h1><p>{register ? "Create your Staff account to manage projects and move tasks forward." : "Sign in to organize your team's projects, tasks and departments."}</p><div className="auth-intro-line" /><p className="muted">Public project and task information remains available without signing in.</p><Link href="/" className="text-link">Explore the workspace →</Link></section>
    <section className="panel auth-card"><h2>{register ? "Create an account" : "Sign in"}</h2><p className="muted">{register ? "New accounts receive Staff access." : "Use your workspace email and password."}</p>
      <Feedback error={error} notice={registered ? "Your account is ready. Sign in to continue." : undefined} />
      {Object.keys(errors).length > 0 && <div ref={summary} tabIndex={-1} className="feedback error" role="alert"><strong>Check the highlighted fields.</strong><ul>{Object.entries(errors).map(([key, message]) => <li key={key}><a href={"#auth-" + key} onClick={() => document.getElementById("auth-" + key)?.focus()}>{message}</a></li>)}</ul></div>}
      <form onSubmit={submit} noValidate className="auth-form">
        {register && <Field id="auth-fullName" label="Full name" required error={errors.fullName}><input name="fullName" autoComplete="name" maxLength={100} value={values.fullName} onChange={(event) => set("fullName", event.target.value)} /></Field>}
        <Field id="auth-email" label="Email" required error={errors.email}><input name="email" type="email" autoComplete="email" maxLength={254} value={values.email} onChange={(event) => set("email", event.target.value)} placeholder="you@company.com" /></Field>
        <Field id="auth-password" label="Password" required error={errors.password}><input name="password" type={showPassword ? "text" : "password"} autoComplete={register ? "new-password" : "current-password"} maxLength={128} value={values.password} onChange={(event) => set("password", event.target.value)} /></Field>
        <button type="button" className="text-button password-toggle" aria-pressed={showPassword} onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Hide password" : "Show password"}</button>
        {register && <><p className="input-hint">Use at least 8 characters.</p><Field id="auth-confirmPassword" label="Confirm password" required error={errors.confirmPassword}><input name="confirmPassword" type={showPassword ? "text" : "password"} autoComplete="new-password" maxLength={128} value={values.confirmPassword} onChange={(event) => set("confirmPassword", event.target.value)} /></Field></>}
        <button className="button auth-submit" disabled={busy}>{busy ? "Please wait…" : register ? "Create account" : "Sign in"}</button>
      </form>
      <p className="auth-switch">{register ? "Already have an account?" : "New to TaskTrack?"} <Link href={register ? "/login" : "/register"}>{register ? "Sign in" : "Create an account"}</Link></p>
    </section></div>;
}
