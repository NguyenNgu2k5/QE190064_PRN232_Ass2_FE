"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Loading, PageHeader, PriorityBadge, StatusBadge, Tags } from "@/components/ui";
import { api } from "@/lib/api";
import type { Task } from "@/lib/types";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>();
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api<Task[]>("/tasks", { signal: controller.signal })
      .then(setTasks)
      .catch((cause: Error) => {
        if (cause.name !== "AbortError") setError(cause.message);
      });
    return () => controller.abort();
  }, []);

  return <>
    <PageHeader eyebrow="Directory" title="Tasks" description="Browse workspace tasks and open one to see its details." action={<Link className="button" href="/admin/tasks">Manage tasks</Link>} />
    {error ? <ErrorState message={error} /> : !tasks ? <Loading /> : tasks.length ? <div className="card-grid">{tasks.map((task) => <Link className="card" href={`/tasks/${task.taskId}`} key={task.taskId}>
      <div className="actions"><StatusBadge value={task.status} task /><PriorityBadge value={task.priority} /></div>
      <h3>{task.title}</h3>
      <p>{task.description || "No description."}</p>
      <Tags tags={task.tags} />
      <div className="card-meta"><span>{task.projectName}</span><span>{task.dueDate || "No due date"}</span></div>
    </Link>)}</div> : <EmptyState text="No tasks have been created yet." />}
  </>;
}
