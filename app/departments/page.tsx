"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Department } from "@/lib/types";
import { DirectoryHeading, EmptyState, ErrorState, Loading, PageHeader } from "@/components/ui";

export default function DepartmentsPage() {
  const [items, setItems] = useState<Department[]>(); const [name, setName] = useState(""); const [error, setError] = useState("");
  useEffect(() => { api<Department[]>("/departments").then(setItems).catch((e) => setError(e.message)); }, []);
  const search = (event: React.FormEvent) => { event.preventDefault(); setItems(undefined); setError(""); api<Department[]>(`/departments/search?${new URLSearchParams({ name: name.trim() })}`).then(setItems).catch((e) => setError(e.message)); };
  return <>
    <PageHeader eyebrow="Directory" title="Departments" description="Browse active departments and the projects they are carrying." action={<Link className="button" href="/admin/departments">Manage departments</Link>} />
    <form className="panel directory-search" onSubmit={search}><div className="field"><label htmlFor="department-name">Department name</label><input id="department-name" type="search" value={name} onChange={(event) => setName(event.target.value)} placeholder="Search by name..." /></div><button className="button">Search</button></form>
    {error ? <ErrorState message={error} /> : !items ? <Loading /> : <>
      <DirectoryHeading title="Department directory" count={items.length} />
      {items.length ? <div className="card-grid directory-grid">{items.map(department => <Link className="card directory-card" href={`/departments/${department.departmentId}`} key={department.departmentId}>
        <div className="card-topline"><span className="directory-card-kind">Department {String(department.departmentId).padStart(2, "0")}</span><span className="directory-card-arrow" aria-hidden="true">↗</span></div>
        <h3>{department.departmentName}</h3>
        <p>{department.departmentDescription || "No department description yet."}</p>
        <div className="card-meta"><span>{department.projects.length} active {department.projects.length === 1 ? "project" : "projects"}</span><span className="card-link">View department</span></div>
      </Link>)}</div> : <EmptyState text="No departments match this name." />}
    </>}
  </>;
}
