import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import type { Task } from "@/lib/types";

const statuses = ["Not started", "In progress", "Completed", "On hold"];
const taskStatuses = ["To do", "In progress", "Done", "Cancelled"];
const priorities = ["Low", "Medium", "High", "Critical"];

export function StatusBadge({ value, task = false }: { value: number; task?: boolean }) { const label = (task ? taskStatuses : statuses)[value] || "Unknown"; return <span className={`badge badge-${value}`}>{label}</span>; }
export function PriorityBadge({ value }: { value: number }) { return <span className={`badge priority-${value}`}>{priorities[value] || "Unknown"}</span>; }
export function Tags({ tags }: { tags: { tagId: number; tagName: string; color?: string | null }[] }) { return <span className="tag-list">{tags.map((tag) => <span className="tag" style={{ "--tag-color": tag.color || "#64748b" } as CSSProperties} key={tag.tagId}>{tag.tagName}</span>)}</span>; }
export function Loading() { return <div className="skeleton-grid" role="status" aria-label="Loading data">{[0, 1, 2].map((item) => <div className="skeleton-card" key={item}><span /><strong /><i /></div>)}</div>; }
export function ErrorState({ message }: { message: string }) { return <div className="error-box" role="alert"><span aria-hidden="true">!</span><div><strong>Connection failed</strong><p>{message}</p></div></div>; }
export function EmptyState({ text }: { text: string }) { return <div className="empty" role="status"><span aria-hidden="true">＋</span><strong>Nothing here yet</strong><p>{text}</p></div>; }
export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) { return <div className="page-header"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="lede">{description}</p></div>{action}</div>; }
export function BackLink({ href = "/", children = "Back" }: { href?: string; children?: ReactNode }) { return <Link className="back-link" href={href}>← {children}</Link>; }

export function DirectoryHeading({ title, count }: { title: string; count: number }) {
  return <div className="directory-heading"><h2>{title}</h2><span>{count} shown</span></div>;
}

export function TaskCard({ task }: { task: Task }) {
  return <Link className="card directory-card task-card" href={`/tasks/${task.taskId}`}>
    <div className="card-topline"><StatusBadge value={task.status} task /><PriorityBadge value={task.priority} /></div>
    <h3>{task.title}</h3>
    <p>{task.description || "No description."}</p>
    <Tags tags={task.tags} />
    <div className="card-meta"><span>{task.projectName}</span><span>{task.dueDate ? <>Due <time dateTime={task.dueDate}>{task.dueDate}</time></> : "No due date"}</span></div>
  </Link>;
}
