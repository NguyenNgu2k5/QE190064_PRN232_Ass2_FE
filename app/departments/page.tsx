"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Pagination, usePagination } from "@/components/Pagination";
import { api } from "@/lib/api";
import type { Department } from "@/lib/types";
import { EmptyState, ErrorState, Loading, PageHeader } from "@/components/ui";

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>(); const [name, setName] = useState(""); const [error, setError] = useState("");
  const pagination = usePagination(items?.length ?? 0);
  useEffect(() => { api<Department[]>("/departments").then(setItems).catch((e) => setError(e.message)); }, []);
  const search = (event: React.FormEvent) => { event.preventDefault(); pagination.setPage(1); setItems(undefined); setError(""); api<Department[]>(`/departments/search?${new URLSearchParams({ name: name.trim() })}`).then(setItems).catch((e) => setError(e.message)); };
  return <><PageHeader eyebrow="Directory" title="Departments" description="Browse departments and the projects they are carrying." /><form className="panel directory-search" onSubmit={search}><div className="field"><label htmlFor="department-name">Department name</label><input id="department-name" type="search" value={name} onChange={(event) => setName(event.target.value)} placeholder="Search by name..." /></div><button className="button">Search</button></form>{error ? <ErrorState message={error} /> : !items ? <Loading /> : items.length ? <><div className="card-grid">{items.slice(pagination.start, pagination.end).map((department) => <Link className="card department-card" href={`/departments/${department.departmentId}`} key={department.departmentId}><p className="eyebrow">Department {String(department.departmentId).padStart(2, "0")}</p><h3>{department.departmentName}</h3><p>{department.departmentDescription}</p><div className="card-meta"><span className="department-project-count"><strong>{department.projects.length}</strong> {department.projects.length === 1 ? "project" : "projects"}</span><span className="card-link">View →</span></div></Link>)}</div><Pagination {...pagination} label="Departments" /></> : <EmptyState text="No departments match this name." />}</>;
}
