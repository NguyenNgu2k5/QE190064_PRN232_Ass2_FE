"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department, Project, Task } from "@/lib/types";
import { EmptyState, ErrorState, Loading, StatusBadge } from "@/components/ui";

export function GuestOverview() {
  const [data, setData] = useState<{ departments: Department[]; projects: Project[]; tasks: Task[] }>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<Department[]>("/departments", { signal: controller.signal }),
      api<Project[]>("/projects", { signal: controller.signal }),
      api<Task[]>("/tasks", { signal: controller.signal }),
    ]).then(([departments, projects, tasks]) => setData({ departments, projects, tasks }))
      .catch((cause: Error) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, []);

  const featured = data?.projects.find(project => project.status === 1) ?? data?.projects[0];
  return <div className="guest-overview">
    <section className="guest-intro" aria-labelledby="guest-overview-heading">
      <div className="guest-intro-copy">
        <p className="eyebrow">The public workspace</p>
        <h1 id="guest-overview-heading">A window into<br /><span>work in motion.</span></h1>
        <p>Meet the teams, explore their projects, and see the work taking shape.</p>
        <div className="actions"><Link className="button" href="/projects">Explore projects <span aria-hidden="true">↗</span></Link><Link className="text-link" href="/tasks">Find a task <span aria-hidden="true">→</span></Link></div>
        {data && !error && <nav className="guest-totals" aria-label="Workspace totals">
          {(["departments", "projects", "tasks"] as const).map(section => <Link href={`/${section}`} key={section}><strong>{data[section].length}</strong><span>{section}</span></Link>)}
        </nav>}
      </div>
      {data && !error && featured && <Link className="guest-feature" href={`/projects/${featured.projectId}`}>
        <div className="guest-feature-top"><p className="eyebrow">Project spotlight</p><StatusBadge value={featured.status} /></div>
        <div className="guest-feature-copy"><span>{featured.departmentName}</span><h2>{featured.projectName}</h2><p>{featured.description || "Explore this project and the work behind it."}</p></div>
        <div className="guest-feature-footer"><span>{data.tasks.filter(task => task.projectId === featured.projectId).length} tasks in this project</span><span>View project <span aria-hidden="true">↗</span></span></div>
      </Link>}
    </section>

    {error ? <><ErrorState message={error} /><button className="button secondary" onClick={() => window.location.reload()}>Try again</button></> : !data ? <Loading /> : <div className="guest-discovery">
      <section aria-labelledby="guest-projects-heading">
        <div className="guest-section-title"><div><p className="eyebrow">Explore the portfolio</p><h2 id="guest-projects-heading">Projects worth a closer look</h2></div><Link href="/projects" aria-label="View all projects">All projects <span aria-hidden="true">↗</span></Link></div>
        {data.projects.length ? <ul className="guest-projects">
          {data.projects.slice(0, 5).map((project, index) => <li key={project.projectId}><Link href={`/projects/${project.projectId}`}>
            <span className="guest-project-number" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><span className="guest-project-department">{project.departmentName}</span><h3>{project.projectName}</h3><p>{project.description || "Open this project to explore its tasks."}</p></div>
            <div className="guest-project-aside"><StatusBadge value={project.status} /><span>{data.tasks.filter(task => task.projectId === project.projectId).length} tasks <span aria-hidden="true">↗</span></span></div>
          </Link></li>)}
        </ul> : <EmptyState text="Projects will appear here when they are available." />}
      </section>
      <section className="guest-teams" aria-labelledby="guest-teams-heading">
        <p className="eyebrow">Behind the work</p><h2 id="guest-teams-heading">Meet the departments</h2><p>Find the people and projects behind each part of the workspace.</p>
        {data.departments.length ? <ul>{data.departments.slice(0, 5).map(department => {
          const count = data.projects.filter(project => project.departmentId === department.departmentId).length;
          return <li key={department.departmentId}><Link href={`/departments/${department.departmentId}`}><span><strong>{department.departmentName}</strong><small>{count} {count === 1 ? "project" : "projects"}</small></span><span aria-hidden="true">↗</span></Link></li>;
        })}</ul> : <EmptyState text="Departments will appear here when they are available." />}
        <Link className="guest-all-teams" href="/departments">Explore all departments <span aria-hidden="true">→</span></Link>
      </section>
    </div>}
  </div>;
}
