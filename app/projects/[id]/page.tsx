"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { BackLink, EmptyState, ErrorState, Loading, PageHeader, PriorityBadge, StatusBadge } from "@/components/ui";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>(); const [item, setItem] = useState<Project>(); const [error, setError] = useState("");
  useEffect(() => { if (id) api<Project>(`/projects/${id}`).then(setItem).catch((e) => setError(e.message)); }, [id]);
  if (error) return <><BackLink href="/departments">Departments</BackLink><ErrorState message={error} /></>;
  if (!item) return <Loading />;
  return <><BackLink href={`/departments/${item.departmentId}`}>{item.departmentName}</BackLink><PageHeader eyebrow="Project" title={item.projectName} description={item.description || "No project description yet."} action={<Link className="button" href="/admin/projects">Manage projects</Link>} /><div className="detail-grid"><section className="panel"><h2>Task list</h2>{item.tasks.length ? <div className="table-wrap"><table><thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due</th></tr></thead><tbody>{item.tasks.map((task) => <tr key={task.taskId}><td><Link className="card-link" href={`/tasks/${task.taskId}`}>{task.title}</Link></td><td><StatusBadge value={task.status} task /></td><td><PriorityBadge value={task.priority} /></td><td>{task.dueDate || "—"}</td></tr>)}</tbody></table></div> : <EmptyState text="No active tasks in this project." />}</section><aside className="panel"><h2>Project details</h2><dl className="facts"><div className="fact"><dt>Department</dt><dd>{item.departmentName}</dd></div><div className="fact"><dt>Status</dt><dd><StatusBadge value={item.status} /></dd></div><div className="fact"><dt>Start date</dt><dd>{item.startDate}</dd></div><div className="fact"><dt>End date</dt><dd>{item.endDate || "Open ended"}</dd></div></dl></aside></div></>;
}
