"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api, json } from "@/lib/api";
import type { Account } from "@/lib/types";
import { readSession } from "@/lib/session";
import { useAuth } from "./AuthProvider";
import { Field, Feedback } from "./Field";
import { Modal } from "./Modal";
import { EmptyState, Loading, PageHeader } from "./ui";

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState<0 | 1>(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const { account, signIn } = useAuth();
  const adminCount = accounts.filter(item => item.role === 1).length;
  const ownAccount = editing?.accountId === account?.accountId;
  const roleLocked = ownAccount || (editing?.role === 1 && adminCount === 1);
  const load = useCallback(async () => {
    try { setAccounts(await api<Account[]>("/accounts")); setError(""); }
    catch (cause) { setError((cause as Error).message); }
    finally { setLoading(false); }
  }, []);
  // Fetch account data on mount; the same loader refreshes it after writes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    if (!name.trim()) { setFormError("Enter a full name."); return; }
    setBusy(true); setFormError("");
    try {
      const updated = await api<Account>("/accounts/" + editing.accountId, json({ fullName: name.trim(), ...(!roleLocked ? { role } : {}) }, "PUT"));
      const session = readSession();
      if (session && updated.accountId === account?.accountId) signIn({ ...session, account: updated });
      setEditing(null); setNotice("Account updated."); await load();
    } catch (cause) { setFormError((cause as Error).message); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return;
    setBusy(true); setFormError("");
    try { await api("/accounts/" + deleting.accountId, { method: "DELETE" }); setDeleting(null); setNotice("Account deleted."); await load(); }
    catch (cause) { setFormError((cause as Error).message); }
    finally { setBusy(false); }
  }
  return <><PageHeader eyebrow="ADMINISTRATION" title="Accounts" description="Manage account names, access roles and account removal." /><Feedback error={error} notice={notice} />
    {loading ? <Loading /> : accounts.length ? <section className="table-wrap" aria-label="Account list" tabIndex={0}><table><thead><tr><th scope="col">Account</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Actions</th></tr></thead><tbody>{accounts.map((item) => <tr key={item.accountId}><td><strong>{item.fullName}</strong>{item.accountId === account?.accountId && <span className="you-label">You</span>}</td><td>{item.email}</td><td><span className={"badge " + (item.role === 1 ? "role-admin" : "role-staff")}>{item.role === 1 ? "Admin" : "Staff"}</span></td><td><div className="actions"><button className="button secondary" onClick={() => { setEditing(item); setName(item.fullName); setRole(item.role); setFormError(""); }}>Edit</button><button className="button danger-outline" disabled={item.role === 1 && adminCount === 1} title={item.role === 1 && adminCount === 1 ? "At least one Admin must remain." : undefined} onClick={() => { setDeleting(item); setFormError(""); }}>Delete</button></div></td></tr>)}</tbody></table></section> : !error && <EmptyState text="No accounts found." />}
    {editing && <Modal title="Edit account" description={`Update the name and access role for ${editing.email}.`} onClose={() => { if (!busy) setEditing(null); }}>
      <Feedback error={formError} />
      <form className="form-grid" onSubmit={save}>
        <p className="form-note full">Fields marked * are required.</p>
        <Field label="Full name" required full><input value={name} maxLength={100} required placeholder="Enter the account holder's name" onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Role" full><select value={role} disabled={roleLocked} aria-describedby="account-role-hint" onChange={(event) => setRole(Number(event.target.value) as 0 | 1)}><option value="0">Staff</option><option value="1">Admin</option></select></Field>
        <p id="account-role-hint" className="input-hint full">{ownAccount ? "You cannot change your own role." : roleLocked ? "At least one Admin must remain." : "Changing a role requires that account to sign in again."}</p>
        <div className="form-actions"><button type="button" className="button secondary" disabled={busy} onClick={() => setEditing(null)}>Cancel</button><button className="button" disabled={busy}>{busy ? "Saving…" : "Save changes"}</button></div>
      </form>
    </Modal>}
    {deleting && <Modal title="Delete account?" onClose={() => { if (!busy) setDeleting(null); }}><p>Delete <strong>{deleting.fullName}</strong>? Accounts that created tasks cannot be deleted.</p><Feedback error={formError} /><div className="form-actions"><button className="button secondary" disabled={busy} onClick={() => setDeleting(null)}>Keep account</button><button className="button danger" disabled={busy} onClick={remove}>{busy ? "Deleting…" : "Yes, delete"}</button></div></Modal>}
  </>;
}
