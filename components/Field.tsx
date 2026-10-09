"use client";
import { cloneElement, useId, type ReactElement, type ReactNode } from "react";

export function Field({ label, required, full, error, children, id: explicitId }: { label: string; required?: boolean; full?: boolean; error?: string; id?: string; children: ReactElement<{ id?: string; "aria-invalid"?: boolean; "aria-describedby"?: string }> }) {
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  return <div className={"field" + (full ? " full" : "")}><label htmlFor={id}>{label}{required && <span aria-hidden="true"> *</span>}</label>
    {cloneElement(children, { id, "aria-invalid": !!error, "aria-describedby": error ? id + "-error" : undefined })}
    {error && <p id={id + "-error"} className="field-error">{error}</p>}
  </div>;
}
export function Feedback({ error, notice }: { error?: string; notice?: ReactNode }) {
  return error ? <div className="feedback error" role="alert">{error}</div> : notice ? <div className="feedback success" role="status">{notice}</div> : null;
}
