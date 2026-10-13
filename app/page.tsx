"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department, Project, Task } from "@/lib/types";
import { EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from "@/components/ui";

export default function Home() {
  const [data, setData] = useState<{ departments: Department[]; projects: Project[]; tasks: Task[] }>();
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api<Department[]>("/departments"), api<Project[]>("/projects"), api<Task[]>("/tasks")]).then(([departments, projects, tasks]) => setData({ departments, projects, tasks })).catch((e) => setError(e.message)); }, []);
  return <>
    <section className="hero"><div className="hero-copy"><div className="hero-status"><span /> Workspace online</div><p className="eyebrow">Task management, made visible</p><h1>Move work forward <em>with clarity.</em></h1><p>A shared view of departments, projects, and the work that moves them forward—without the noise.</p><div className="actions"><Link href="/admin/tasks" className="button">Open workspace <span aria-hidden="true">→</span></Link><Link href="/search" className="text-link">Find a task <span aria-hidden="true">↗</span></Link></div></div><div className="hero-art"><div><p className="eyebrow">How work flows</p><h2>From brief to done, every step stays visible.</h2></div><div className="flow-board" aria-hidden="true"><div><span>01</span><strong>Plan</strong><i /></div><div><span>02</span><strong>Build</strong><i /></div><div><span>03</span><strong>Review</strong><i /></div></div></div></section>
    <PageHeader eyebrow="Overview" title="A calm view of busy work." description="Explore active projects, see how work is distributed, and jump into the next useful detail." />
    {error ? <ErrorState message={error} /> : !data ? <Loading /> : <>
      <section className="metric-grid"><div className="metric"><span className="metric-index">01</span><strong>{data.departments.length}</strong><span>Active departments</span></div><div className="metric"><span className="metric-index">02</span><strong>{data.projects.length}</strong><span>Active projects</span></div><div className="metric"><span className="metric-index">03</span><strong>{data.tasks.length}</strong><span>Active tasks</span></div></section>
      <div className="section-label"><div><p className="eyebrow">Current portfolio</p><h2>Projects in motion</h2></div><Link href="/projects">View all projects →</Link></div>
      {data.projects.length ? <div className="card-grid project-grid">{data.projects.slice(0, 6).map((project, index) => <Link className={`card project-card${index === 0 ? " featured" : ""}`} href={`/projects/${project.projectId}`} key={project.projectId}><div className="card-topline"><span className="project-number">{String(index + 1).padStart(2, "0")}</span><StatusBadge value={project.status} /></div><h3>{project.projectName}</h3><p>{project.description || "No project description yet."}</p><div className="card-meta"><span>{project.departmentName}</span><span>Starts {project.startDate}</span></div><span className="card-arrow" aria-hidden="true">↗</span></Link>)}</div> : <EmptyState text="Create a project to start organizing work." />}
    </>}
  </>;
}
