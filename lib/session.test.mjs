import assert from "node:assert/strict";
import test from "node:test";
import { clearSession, readSession, saveSession, sessionKey } from "./session.ts";

test("session storage handles SSR, corrupt data, invalid roles and round trips", () => {
  assert.equal(readSession(), null);
  const values = new Map();
  globalThis.window = { localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) } };
  try {
    for (const value of ["broken JSON", "null", '{}', JSON.stringify({ token: "token", expiresAt: "invalid", account: { accountId: 1, role: 0 } }), JSON.stringify({ token: "token", expiresAt: new Date().toISOString(), account: { accountId: 1, role: 2 } })]) {
      values.set(sessionKey, value);
      assert.equal(readSession(), null);
    }
    const session = { token: "token", expiresAt: new Date().toISOString(), account: { accountId: 1, fullName: "Staff", email: "staff@example.com", role: 0, createdDate: new Date().toISOString() } };
    saveSession(session);
    assert.deepEqual(readSession(), session);
    clearSession();
    assert.equal(readSession(), null);
  } finally { delete globalThis.window; }
});
