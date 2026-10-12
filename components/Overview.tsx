"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department, Project, Tag, Task } from "@/lib/types";
import { ErrorState, Loading, PageHeader } from "./ui";

const sections = ["departments", "projects", "tasks", "tags"] as const;
export function Overview() {
  const [data, setData] = useState<{ departments: Department[]; projects: Project[]; tasks: Task[]; tags: Tag[] }>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([api<Department[]>("/departments", { signal: controller.signal }), api<Project[]>("/projects", { signal: controller.signal }), api<Task[]>("/tasks", { signal: controller.signal }), api<Tag[]>("/tags", { signal: controller.signal })])
      .then(([departments, projects, tasks, tags]) => setData({ departments, projects, tasks, tags }))
      .catch((cause: Error) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, []);
  return <>
    <PageHeader eyebrow="Management" title="Management dashboard" description="Manage departments, projects, tasks and tags with your workspace account." action={<Link className="button" href="/admin/tasks">Manage tasks</Link>} />
    {error ? <ErrorState message={error} /> : !data ? <Loading /> : <section className="metric-grid admin-metrics" aria-label="Workspace totals">
      {sections.map(section => <Link href={"/admin/" + section} className="metric" key={section}><span>Total {section}</span><strong>{data[section].length}</strong><span>{section === "tags" ? "Available labels" : "Active records"}</span></Link>)}
    </section>}
  </>;
}
