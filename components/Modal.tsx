"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";

export function Modal({ title, description, children, onClose }: { title: string; description?: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { dialog?.close(); if (previous instanceof HTMLElement) previous.focus(); };
  }, []);
  return <dialog ref={ref} className="modal" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} onCancel={(event) => { event.preventDefault(); onClose(); }}>
    <div className="modal-header"><div><h2 id={titleId}>{title}</h2>{description && <p id={descriptionId} className="modal-description">{description}</p>}</div><button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}><span aria-hidden="true">×</span></button></div>
    <div className="modal-body">{children}</div>
  </dialog>;
}
