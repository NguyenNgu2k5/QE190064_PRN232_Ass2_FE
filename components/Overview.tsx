"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department, Project, Tag, Task } from "@/lib/types";
import { EmptyState, ErrorState, Loading, PageHeader, StatusBadge } from "./ui";
import { Icon, type IconName } from "./Icon";

export function Overview({ management = false }: { management?: boolean }) {
  const [data, setData] = useState<{ departments: Department[]; projects: Project[]; tasks: Task[]; tags: Tag[] }>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api<Department[]>("/departments", { signal: controller.signal }), api<Project[]>("/projects", { signal: controller.signal }), api<Task[]>("/tasks", { signal: controller.signal }), api<Tag[]>("/tags", { signal: controller.signal })])
      .then(([departments, projects, tasks, tags]) => setData({ departments, projects, tasks, tags }))
      .catch((cause: Error) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, []);
  const sections = ["departments", "projects", "tasks", "tags"] as const;
  return <>
    <PageHeader eyebrow={management ? "MANAGEMENT" : "WORKSPACE"} title={management ? "Management dashboard" : "Workspace overview"} description={management ? "Manage your team's work from one place." : "Explore departments, projects and the work behind them."} action={<Link className="button" href={management ? "/admin/tasks" : "/admin"}>{management ? "Manage tasks" : "Open management"}<Icon name="arrow" /></Link>} />
    {error ? <ErrorState message={error} /> : !data ? <Loading /> : <>
      <section className="metric-grid" aria-label="Workspace totals">{sections.map((section) => <Link href={management ? "/admin/" + section : "/" + section} className="metric" key={section}><div className="metric-top"><span>Total {section}</span><span className={"metric-icon " + section}><Icon name={section as IconName} /></span></div><strong>{data[section].length}</strong><span className="metric-caption">{section === "tags" ? "Available labels" : "Active records"}</span></Link>)}</section>
      <div className="overview-grid"><section className="panel"><div className="section-label"><div><p className="eyebrow">WORK IN PROGRESS</p><h2>Task distribution</h2></div><Link href="/tasks" className="text-link">View tasks →</Link></div><div className="status-summary">{["To do", "In progress", "Done", "Cancelled"].map((label, status) => { const count = data.tasks.filter((task) => task.status === status).length; return <div key={label}><div><span><StatusBadge value={status} task /></span><strong>{count}</strong></div><div className="progress-track"><span className={"progress-" + status} style={{ width: (data.tasks.length ? count / data.tasks.length * 100 : 0) + "%" }} /></div></div>; })}</div></section>
      <section className="panel quick-links"><p className="eyebrow">QUICK ACCESS</p><h2>{management ? "Keep things moving" : "Find your next detail"}</h2><p className="muted">Go straight to the section you need.</p>{sections.map((section) => <Link href={management ? "/admin/" + section : "/" + section} key={section}><Icon name={section as IconName} /><span>{section.charAt(0).toUpperCase() + section.slice(1)}</span><Icon name="arrow" /></Link>)}</section></div>
      <div className="section-label"><div><p className="eyebrow">PROJECT DIRECTORY</p><h2>Recent projects</h2></div><Link href="/projects" className="text-link">View all projects →</Link></div>
      {data.projects.length ? <div className="card-grid">{data.projects.slice(0, 6).map((project) => <Link className="card project-card" href={"/projects/" + project.projectId} key={project.projectId}><div className="card-topline"><span className="project-glyph"><Icon name="projects" /></span><StatusBadge value={project.status} /></div><h3>{project.projectName}</h3><p>{project.description || "No project description yet."}</p><div className="card-meta"><span>{project.departmentName}</span><span>{project.startDate}</span></div></Link>)}</div> : <EmptyState text="No active projects yet." />}
    </>}
  </>;
}
