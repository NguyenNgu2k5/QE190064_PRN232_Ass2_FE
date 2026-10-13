"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Field, Feedback } from "@/components/Field";
import { PageHeader } from "@/components/ui";
import { api, json } from "@/lib/api";
import { clearSession, readSession } from "@/lib/session";
import type { Account } from "@/lib/types";

function Profile() {
  const { account, signIn } = useAuth();
  const [name, setName] = useState(account!.fullName);
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState<"name" | "password" | null>(null);
  const [nameError, setNameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [notice, setNotice] = useState("");

  async function saveName(event: FormEvent) {
    event.preventDefault(); setNameError(""); setNotice("");
    if (!name.trim() || name.trim().length > 100) { setNameError("Enter a full name of 1–100 characters."); return; }
    setBusy("name");
    try {
      const updated = await api<Account>("/auth/profile", json({ fullName: name.trim() }, "PUT"));
      const session = readSession();
      if (session) signIn({ ...session, account: updated });
      setName(updated.fullName); setNotice("Your name has been updated.");
    } catch (cause) { setNameError((cause as Error).message); }
    finally { setBusy(null); }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault(); setPasswordError("");
    if (!passwords.current || passwords.next.length < 8 || passwords.next.length > 128 || passwords.next !== passwords.confirm) {
      setPasswordError("Enter your current password, use 8–128 characters for the new password, and confirm it exactly."); return;
    }
    setBusy("password");
    try {
      await api("/auth/profile", json({ currentPassword: passwords.current, newPassword: passwords.next }, "PUT"));
      clearSession();
      window.location.replace("/login?passwordChanged=1");
    } catch (cause) { setPasswordError((cause as Error).message); setBusy(null); }
  }

  return <>
    <PageHeader eyebrow="Your account" title="Profile" description="Update your name or change your password." />
    <div className="profile-layout">
      <form className="panel profile-card" onSubmit={saveName} noValidate>
        <div className="profile-card-header"><div><h2>Account details</h2><p>Manage the name shown across your workspace.</p></div><span className="profile-role" aria-label={`Access role: ${account!.role === 1 ? "Admin" : "Staff"}`}>{account!.role === 1 ? "Admin" : "Staff"}</span></div>
        <Feedback error={nameError} notice={notice} />
        <div className="profile-fields">
          <Field label="Email"><input type="email" value={account!.email} readOnly aria-describedby="profile-email-hint" /></Field>
          <p id="profile-email-hint" className="input-hint">Your sign-in email is read-only.</p>
          <Field label="Full name" required><input required autoComplete="name" maxLength={100} value={name} onChange={event => setName(event.target.value)} /></Field>
        </div>
        <div className="profile-actions"><button className="button" disabled={!!busy}>{busy === "name" ? "Saving…" : "Save name"}</button></div>
      </form>
      <form className="panel profile-card" onSubmit={savePassword} noValidate>
        <div className="profile-card-header"><div><h2>Change password</h2><p id="profile-password-hint">Use 8–128 characters for your new password.</p></div></div>
        <p className="profile-session-note">Changing your password signs you out of existing sessions.</p>
        <Feedback error={passwordError} />
        <div className="profile-fields">
          <Field label="Current password" required><input required type="password" autoComplete="current-password" maxLength={128} value={passwords.current} onChange={event => setPasswords(value => ({ ...value, current: event.target.value }))} /></Field>
          <Field label="New password" required><input required type="password" autoComplete="new-password" aria-describedby="profile-password-hint" maxLength={128} value={passwords.next} onChange={event => setPasswords(value => ({ ...value, next: event.target.value }))} /></Field>
          <Field label="Confirm new password" required><input required type="password" autoComplete="new-password" maxLength={128} value={passwords.confirm} onChange={event => setPasswords(value => ({ ...value, confirm: event.target.value }))} /></Field>
        </div>
        <div className="profile-actions"><button className="button" disabled={!!busy}>{busy === "password" ? "Saving…" : "Change password"}</button></div>
      </form>
    </div>
  </>;
}

export default function ProfilePage() { return <ProtectedRoute><Profile /></ProtectedRoute>; }
