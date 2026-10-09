"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department } from "@/lib/types";
import { BackLink, EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from "@/components/ui";

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>(); const [item, setItem] = useState<Department>(); const [error, setError] = useState("");
  useEffect(() => { if (id) api<Department>(`/departments/${id}`).then(setItem).catch((e) => setError(e.message)); }, [id]);
  if (error) return <><BackLink href="/departments">Departments</BackLink><ErrorState message={error} /></>;
  if (!item) return <Loading />;
  return <><BackLink href="/departments">All departments</BackLink><PageHeader eyebrow="Department" title={item.departmentName} description={item.departmentDescription} action={<Link className="button" href="/admin/departments">Edit department</Link>} /><div className="section-label"><h2>Projects</h2><span className="muted">{item.projects.length} active</span></div>{item.projects.length ? <div className="card-grid">{item.projects.map((project) => <Link className="card" href={`/projects/${project.projectId}`} key={project.projectId}><StatusBadge value={project.status} /><h3>{project.projectName}</h3><div className="card-meta"><span>Starts {project.startDate}</span><span className="card-link">Open →</span></div></Link>)}</div> : <EmptyState text="This department has no active projects." />}</>;
}
