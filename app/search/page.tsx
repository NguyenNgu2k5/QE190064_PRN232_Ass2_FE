"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Project, Tag, Task } from "@/lib/types";
import { DirectoryHeading, EmptyState, ErrorState, Loading, PageHeader, TaskCard } from "@/components/ui";

export default function SearchPage() {
  const [tasks, setTasks] = useState<Task[]>(); const [projects, setProjects] = useState<Project[]>([]); const [tags, setTags] = useState<Tag[]>([]); const [error, setError] = useState("");
  const [filters, setFilters] = useState({ title: "", status: "", priority: "", projectId: "", tagId: "" });
  useEffect(() => { Promise.all([api<Project[]>("/projects"), api<Tag[]>("/tags")]).then(([p, t]) => { setProjects(p); setTags(t); }).catch((e) => setError(e.message)); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value).map(([key, value]) => [key, value]));
      api<Task[]>(`/tasks/search?${query}`, { signal: controller.signal }).then(setTasks).catch((e) => { if (e.name !== "AbortError") setError(e.message); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [filters]);
  const update = (key: keyof typeof filters, value: string) => { setTasks(undefined); setError(""); setFilters((current) => ({ ...current, [key]: value })); };
  return <>
    <PageHeader eyebrow="Directory" title="Task search" description="Filter tasks by title, status, priority, project, or tag. Results refresh as you adjust the filters." action={<Link className="button" href="/admin/tasks">Manage tasks</Link>} />
    <div className="panel search-grid"><div className="field"><label htmlFor="title">Title</label><input id="title" type="search" value={filters.title} onChange={(e) => update("title", e.target.value)} placeholder="Search task titles..." /></div><div className="field"><label htmlFor="status">Status</label><select id="status" value={filters.status} onChange={(e) => update("status", e.target.value)}><option value="">Any status</option><option value="0">To do</option><option value="1">In progress</option><option value="2">Done</option><option value="3">Cancelled</option></select></div><div className="field"><label htmlFor="priority">Priority</label><select id="priority" value={filters.priority} onChange={(e) => update("priority", e.target.value)}><option value="">Any priority</option><option value="0">Low</option><option value="1">Medium</option><option value="2">High</option><option value="3">Critical</option></select></div><div className="field"><label htmlFor="project">Project</label><select id="project" value={filters.projectId} onChange={(e) => update("projectId", e.target.value)}><option value="">Any project</option>{projects.map((project) => <option value={project.projectId} key={project.projectId}>{project.projectName}</option>)}</select></div><div className="field"><label htmlFor="tag">Tag</label><select id="tag" value={filters.tagId} onChange={(e) => update("tagId", e.target.value)}><option value="">Any tag</option>{tags.map((tag) => <option value={tag.tagId} key={tag.tagId}>{tag.tagName}</option>)}</select></div></div>
    {error ? <ErrorState message={error} /> : !tasks ? <Loading /> : <>
      <DirectoryHeading title="Search results" count={tasks.length} />
      {tasks.length ? <div className="card-grid directory-grid">{tasks.map(task => <TaskCard task={task} key={task.taskId} />)}</div> : <EmptyState text="No tasks match these filters." />}
    </>}
  </>;
}
