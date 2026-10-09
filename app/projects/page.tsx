"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from "@/components/ui";
import { api } from "@/lib/api";
import type { Department, Project } from "@/lib/types";

export default function ProjectsPage() {
  const [items, setItems] = useState<Project[]>();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filters, setFilters] = useState({ name: "", status: "", departmentId: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([api<Project[]>("/projects"), api<Department[]>("/departments")]).then(([projects, departmentList]) => { setItems(projects); setDepartments(departmentList); }).catch((e) => setError(e.message));
  }, []);

  const search = (event: React.FormEvent) => { event.preventDefault(); setItems(undefined); setError(""); api<Project[]>(`/projects/search?${new URLSearchParams(filters)}`).then(setItems).catch((e) => setError(e.message)); };
  const update = (key: keyof typeof filters, value: string) => setFilters((current) => ({ ...current, [key]: value }));

  return <>
    <PageHeader eyebrow="Directory" title="Projects" description="See every active project at a glance, then open the task list behind it." action={<Link className="button" href="/admin/projects">Manage projects</Link>} />
    <form className="panel directory-search project-search" onSubmit={search}><div className="field"><label htmlFor="project-name">Project name</label><input id="project-name" type="search" value={filters.name} onChange={(event) => update("name", event.target.value)} placeholder="Search by name..." /></div><div className="field"><label htmlFor="project-status">Status</label><select id="project-status" value={filters.status} onChange={(event) => update("status", event.target.value)}><option value="">Any status</option><option value="0">Not started</option><option value="1">In progress</option><option value="2">Completed</option><option value="3">On hold</option></select></div><div className="field"><label htmlFor="project-department">Department</label><select id="project-department" value={filters.departmentId} onChange={(event) => update("departmentId", event.target.value)}><option value="">Any department</option>{departments.map((department) => <option value={department.departmentId} key={department.departmentId}>{department.departmentName}</option>)}</select></div><button className="button">Search</button></form>
    {error ? <ErrorState message={error} /> : !items ? <Loading /> : items.length ? <div className="card-grid">{items.map((project) => <Link className="card" href={`/projects/${project.projectId}`} key={project.projectId}><StatusBadge value={project.status} /><h3>{project.projectName}</h3><p>{project.description || "No project description yet."}</p><div className="card-meta"><span>{project.departmentName}</span><span>{project.startDate}</span></div></Link>)}</div> : <EmptyState text="No projects match these filters." />}
  </>;
}
