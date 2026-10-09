"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";
import { BackLink, ErrorState, Loading, PageHeader, PriorityBadge, StatusBadge, Tags } from "@/components/ui";

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>(); const [item, setItem] = useState<Task>(); const [error, setError] = useState("");
  useEffect(() => { if (id) api<Task>(`/tasks/${id}`).then(setItem).catch((e) => setError(e.message)); }, [id]);
  if (error) return <><BackLink href="/search">Search</BackLink><ErrorState message={error} /></>;
  if (!item) return <Loading />;
  return <><BackLink href={`/projects/${item.projectId}`}>{item.projectName}</BackLink><PageHeader eyebrow="Task" title={item.title} description={item.description || "No task description yet."} action={<Link className="button" href="/admin/tasks">Manage tasks</Link>} /><div className="detail-grid"><section className="panel"><h2>Task information</h2><dl className="facts"><div className="fact"><dt>Status</dt><dd><StatusBadge value={item.status} task /></dd></div><div className="fact"><dt>Priority</dt><dd><PriorityBadge value={item.priority} /></dd></div><div className="fact"><dt>Due date</dt><dd>{item.dueDate || "No due date"}</dd></div><div className="fact"><dt>Department</dt><dd>{item.departmentName}</dd></div><div className="fact"><dt>Created</dt><dd>{new Date(item.createdDate).toLocaleDateString()}</dd></div><div className="fact"><dt>Tags</dt><dd><Tags tags={item.tags} /></dd></div></dl></section><aside className="panel"><h2>Project</h2><p>{item.projectName}</p><Link className="card-link" href={`/projects/${item.projectId}`}>Open project →</Link></aside></div></>;
}
