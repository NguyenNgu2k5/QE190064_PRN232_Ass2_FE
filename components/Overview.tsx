"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department, Project, Tag, Task } from "@/lib/types";
import { EmptyState, ErrorState, Loading, PageHeader, PriorityBadge, StatusBadge } from "@/components/ui";

const taskStatuses = ["To do", "In progress", "Done", "Cancelled"];

export function Overview() {
  const [data, setData] = useState<{ departments: Department[]; projects: Project[]; tasks: Task[]; tags: Tag[] }>();
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api<Department[]>("/departments", { signal: controller.signal }),
      api<Project[]>("/projects", { signal: controller.signal }),
      api<Task[]>("/tasks", { signal: controller.signal }),
      api<Tag[]>("/tags", { signal: controller.signal }),
    ])
      .then(([departments, projects, tasks, tags]) => setData({ departments, projects, tasks, tags }))
      .catch((cause: Error) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, []);

  const counts = taskStatuses.map((_, status) => data?.tasks.filter(task => task.status === status).length ?? 0);
  const trackedTasks = data?.tasks.filter(task => task.status !== 3) ?? [];
  const completion = Math.round(counts[2] / Math.max(1, trackedTasks.length) * 100);
  const className = "overview-dashboard";
  const header = <PageHeader eyebrow="Work at a glance" title="Management dashboard" description="A shared view of your projects, progress, and what needs attention." action={<Link className="button" href="/admin/tasks">Open workspace <span aria-hidden="true">↗</span></Link>} />;
  if (error || !data) return <div className={className}>
    {header}
    {error ? <><ErrorState message={error} /><button className="button secondary dashboard-retry" onClick={() => window.location.reload()}>Try again</button></> : <Loading />}
  </div>;

  const now = new Date();
  // Due dates are calendar dates, so compare them with today's date in the viewer's timezone.
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const deadlines = data.tasks.filter(task => task.status < 2 && task.dueDate)
    .sort((a, b) => a.dueDate!.localeCompare(b.dueDate!));
  const overdue = deadlines.filter(task => task.dueDate! < today).length;
  const projectDepartments = new Map(data.projects.map(project => [project.projectId, project.departmentId]));
  const workloads = data.departments.map(department => ({
    ...department,
    count: data.tasks.filter(task => projectDepartments.get(task.projectId) === department.departmentId).length,
  })).sort((a, b) => b.count - a.count);
  const maxWorkload = Math.max(1, ...workloads.map(department => department.count));

  return <div className={className}>
    {header}
    <section className="metric-grid dashboard-metrics admin-metrics" aria-label="Workspace totals">
      {(["departments", "projects", "tasks", "tags"] as const).map(section => <Link href={"/admin/" + section} className={"metric" + (section === "tasks" ? " dashboard-metric-primary" : "")} key={section}><span>Total {section}</span><strong>{data[section].length}</strong><span>{section === "tags" ? "Available labels" : "Active records"} <span aria-hidden="true">↗</span></span></Link>)}
    </section>


    <div className="dashboard-grid">
      <section className="panel dashboard-status" aria-labelledby="task-status-heading">
        <div className="dashboard-panel-heading"><div><h2 id="task-status-heading">Task status</h2><p>How work is moving through the workspace.</p></div><Link href="/tasks" aria-label="View all tasks">View tasks <span aria-hidden="true">↗</span></Link></div>
        {data.tasks.length ? <div className="dashboard-status-body">
          <div className="dashboard-donut" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <circle className="dashboard-ring-track" cx="50" cy="50" r="42" />
              {counts.map((count, status) => <circle className={`dashboard-ring dashboard-status-${status}`} cx="50" cy="50" r="42" pathLength="100" strokeDasharray={`${count / data.tasks.length * 100} 100`} strokeDashoffset={-counts.slice(0, status).reduce((sum, value) => sum + value, 0) / data.tasks.length * 100} key={status} />)}
            </svg>
            <div><strong>{data.tasks.length}</strong><span>Total tasks</span></div>
          </div>
          <ul className="dashboard-legend" aria-label="Task counts by status">
            {taskStatuses.map((label, status) => <li key={label}><span className={`dashboard-dot dashboard-status-${status}`} aria-hidden="true" /><span>{label}</span><strong>{counts[status]}</strong><small>{Math.round(counts[status] / data.tasks.length * 100)}%</small></li>)}
          </ul>
        </div> : <EmptyState text="Create a task to see the status breakdown." />}
      </section>

      <section className="panel dashboard-workload" aria-labelledby="department-workload-heading">
        <div className="dashboard-panel-heading"><div><h2 id="department-workload-heading">Work by department</h2><p>{workloads.length > 6 ? "Top 6 departments by task count." : "Task distribution across departments."}</p></div><Link href="/departments" aria-label="View all departments">View all <span aria-hidden="true">↗</span></Link></div>
        {workloads.length ? <ul className="dashboard-workload-list">
          {workloads.slice(0, 6).map(department => <li key={department.departmentId}><Link href={`/departments/${department.departmentId}`}><span>{department.departmentName}</span><div className="dashboard-bar" aria-hidden="true"><span style={{ width: `${department.count / maxWorkload * 100}%` }} /></div><strong>{department.count}<small> tasks</small></strong></Link></li>)}
        </ul> : <EmptyState text="Create a department to organize your workspace." />}
      </section>

      <section className="panel dashboard-projects" aria-labelledby="project-progress-heading">
        <div className="dashboard-panel-heading"><div><h2 id="project-progress-heading">Project progress</h2><p>Completed tasks in your {data.projects.length > 6 ? "6 most recent" : "current"} projects. Cancelled tasks excluded.</p></div><Link href="/projects" aria-label="View all projects">View all <span aria-hidden="true">↗</span></Link></div>
        {data.projects.length ? <ul className="dashboard-project-list">
          {data.projects.slice(0, 6).map(project => {
            const tasks = trackedTasks.filter(task => task.projectId === project.projectId);
            const done = tasks.filter(task => task.status === 2).length;
            const progress = Math.round(done / Math.max(1, tasks.length) * 100);
            return <li key={project.projectId}>
              <div className="dashboard-project-title"><Link href={`/projects/${project.projectId}`}><strong>{project.projectName}</strong><span>{project.departmentName}</span></Link><StatusBadge value={project.status} /></div>
              <div className="dashboard-project-progress"><progress max="100" value={progress} aria-label={`${project.projectName} task completion`} /><strong>{tasks.length ? `${progress}%` : "—"}</strong><span>{tasks.length ? `${done}/${tasks.length} tasks done` : "No non-cancelled tasks"}</span></div>
            </li>;
          })}
        </ul> : <EmptyState text="Create a project to start tracking progress." />}
      </section>

      <section className="panel dashboard-deadlines" aria-labelledby="task-deadlines-heading" id="task-deadlines">
        <div className="dashboard-panel-heading"><div><h2 id="task-deadlines-heading">Task deadlines</h2><p>Open tasks, earliest due first.</p></div><Link href="/tasks" aria-label="View all task deadlines">View all <span aria-hidden="true">↗</span></Link></div>
        {deadlines.length ? <ul className="dashboard-deadline-list">
          {deadlines.slice(0, 5).map(task => <li key={task.taskId}><Link href={`/tasks/${task.taskId}`}>
            <span className={`dashboard-deadline-marker${task.dueDate! < today ? " is-overdue" : ""}`} aria-hidden="true">{task.dueDate! < today ? "!" : "↗"}</span>
            <div><strong>{task.title}</strong><span>{task.projectName}</span><span className={`dashboard-deadline-date${task.dueDate! < today ? " is-overdue" : ""}`}><time dateTime={task.dueDate!}>{task.dueDate}</time> · {task.dueDate! < today ? "Overdue" : task.dueDate === today ? "Due today" : "Upcoming"}</span></div>
            <PriorityBadge value={task.priority} />
          </Link></li>)}
        </ul> : <EmptyState text="No open tasks with a due date. You're all caught up." />}
      </section>
    </div>
    <p className="dashboard-note"><strong>Completion {completion}% · {overdue} overdue tasks.</strong> Workspace snapshot · Counts include active records. Completion rates exclude cancelled tasks.</p>
  </div>;
}
