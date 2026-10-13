"use client";
import { cloneElement, useId, useState, type ReactElement, type ReactNode } from "react";

export function Field({ label, required, full, error, children, id: explicitId }: { label: string; required?: boolean; full?: boolean; error?: string; id?: string; children: ReactElement<{ id?: string; type?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }> }) {
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  const password = children.type === "input" && children.props.type === "password";
  const [visible, setVisible] = useState(false);
  const describedBy = [children.props["aria-describedby"], error && id + "-error"].filter(Boolean).join(" ") || undefined;
  const input = cloneElement(children, { id, "aria-invalid": !!error, "aria-describedby": describedBy, ...(password ? { type: visible ? "text" : "password" } : {}) });
  return <div className={"field" + (full ? " full" : "")}><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {password ? <div className="password-input">{input}<button type="button" className="password-toggle" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-controls={id} aria-pressed={visible} onClick={() => setVisible(value => !value)}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />{visible && <path d="m3 3 18 18" />}</svg>
    </button></div> : input}
    {error && <p id={id + "-error"} className="field-error">{error}</p>}
  </div>;
}
export function Feedback({ error, notice }: { error?: string; notice?: ReactNode }) {
  return error ? <div className="feedback error" role="alert">{error}</div> : notice ? <div className="feedback success" role="status">{notice}</div> : null;
}
