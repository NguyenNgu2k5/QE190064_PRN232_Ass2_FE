import assert from "node:assert/strict";
import test from "node:test";
import { validateAuth } from "./auth-validation.ts";

test("registration validates every field and password confirmation", () => {
  const errors = validateAuth({ fullName: " ", email: "invalid", password: "short", confirmPassword: "different" }, true);
  assert.deepEqual(Object.keys(errors).sort(), ["confirmPassword", "email", "fullName", "password"]);
  assert.deepEqual(validateAuth({ fullName: "Staff", email: "staff@example.com", password: "ValidPass123", confirmPassword: "ValidPass123" }, true), {});
  assert.ok(validateAuth({ fullName: "Staff", email: "staff@example.com", password: "", confirmPassword: "" }, true).confirmPassword);
});
test("login does not apply registration-only fields or password length", () => {
  assert.deepEqual(validateAuth({ fullName: "", email: "staff@example.com", password: "wrong", confirmPassword: "" }, false), {});
});
