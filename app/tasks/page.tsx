"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DirectoryHeading, EmptyState, ErrorState, Loading, PageHeader, TaskCard } from "@/components/ui";
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
    <PageHeader eyebrow="Directory" title="Tasks" description="Browse workspace tasks and open one to see its details." action={<div className="actions"><Link className="button secondary" href="/search">Search tasks</Link><Link className="button" href="/admin/tasks">Manage tasks</Link></div>} />
    {error ? <ErrorState message={error} /> : !tasks ? <Loading /> : <>
      <DirectoryHeading title="Task directory" count={tasks.length} />
      {tasks.length ? <div className="card-grid directory-grid">{tasks.map(task => <TaskCard task={task} key={task.taskId} />)}</div> : <EmptyState text="No tasks have been created yet." />}
    </>}
  </>;
}
