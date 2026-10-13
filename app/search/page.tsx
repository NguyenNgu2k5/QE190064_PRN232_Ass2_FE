"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department, Project, Tag, Task } from "@/lib/types";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/ui";

export default function SearchPage() {
  const [data, setData] = useState<{ departments: Department[]; projects: Project[]; tasks: Task[]; tags: Tag[] }>();
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [kind, setKind] = useState("all");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<Department[]>("/departments", { signal: controller.signal }),
      api<Project[]>("/projects", { signal: controller.signal }),
      api<Task[]>("/tasks", { signal: controller.signal }),
      api<Tag[]>("/tags", { signal: controller.signal }),
    ]).then(([departments, projects, tasks, tags]) => setData({ departments, projects, tasks, tags }))
      .catch((cause: Error) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, []);

  const query = keyword.trim().toLowerCase();
  // shortcut: search full public lists locally; use a paginated search API when directories outgrow full-list endpoints.
  const matches = (name: string, description?: string | null) => `${name} ${description ?? ""}`.toLowerCase().includes(query);
  const groups = data ? [
    { kind: "departments", title: "Departments", items: data.departments.filter(item => matches(item.departmentName, item.departmentDescription)).map(item => ({ id: item.departmentId, title: item.departmentName, description: item.departmentDescription, href: `/departments/${item.departmentId}` })) },
    { kind: "projects", title: "Projects", items: data.projects.filter(item => matches(item.projectName, item.description)).map(item => ({ id: item.projectId, title: item.projectName, description: item.description, href: `/projects/${item.projectId}` })) },
    { kind: "tasks", title: "Tasks", items: data.tasks.filter(item => matches(item.title, item.description)).map(item => ({ id: item.taskId, title: item.title, description: item.description, href: `/tasks/${item.taskId}` })) },
    { kind: "tags", title: "Tags", items: data.tags.filter(item => matches(item.tagName)).map(item => ({ id: item.tagId, title: item.tagName, description: `Find tasks labeled ${item.tagName}.`, href: `/tasks?tagId=${item.tagId}` })) },
  ].filter(group => kind === "all" || kind === group.kind) : [];
  const total = groups.reduce((sum, group) => sum + group.items.length, 0);

  return <>
    <PageHeader eyebrow="Search" title="Find anything in your workspace." description="Search names and descriptions across departments, projects, tasks and tags. Results update as you type." />
    <div className="panel directory-search workspace-search"><div className="field"><label htmlFor="workspace-keyword">Search workspace</label><input id="workspace-keyword" type="search" value={keyword} onChange={event => setKeyword(event.target.value)} placeholder="Search the whole workspace..." /></div><div className="field"><label htmlFor="workspace-kind">Result type</label><select id="workspace-kind" value={kind} onChange={event => setKind(event.target.value)}><option value="all">All types</option><option value="departments">Departments</option><option value="projects">Projects</option><option value="tasks">Tasks</option><option value="tags">Tags</option></select></div></div>
    {error ? <><ErrorState message={error} /><button className="button secondary" onClick={() => window.location.reload()}>Try again</button></> : !data ? <Loading /> : <>
      <p className="workspace-search-count" role="status" aria-live="polite">{total} {total === 1 ? "result" : "results"}{query ? ` for “${keyword.trim()}”` : " across the workspace"}</p>
      {total ? groups.filter(group => group.items.length).map(group => <section className="workspace-results" aria-labelledby={`search-${group.kind}-heading`} key={group.kind}>
        <h2 id={`search-${group.kind}-heading`}>{group.title} <span>{group.items.length}</span></h2>
        <div className="card-grid">{group.items.map(item => <Link className="card" href={item.href} key={item.id}><p className="eyebrow">{group.title}</p><h3>{item.title}</h3><p>{item.description || "Open this result to see its details."}</p><span className="card-link">{group.kind === "tags" ? "View tagged tasks" : "View details"} <span aria-hidden="true">→</span></span></Link>)}</div>
      </section>) : <EmptyState text="No results match your search. Try another keyword or result type." />}
    </>}
  </>;
}
