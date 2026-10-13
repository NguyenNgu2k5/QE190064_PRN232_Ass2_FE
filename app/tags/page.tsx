"use client";

import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Loading, PageHeader, Tags } from "@/components/ui";
import { Pagination, usePagination } from "@/components/Pagination";
import { api } from "@/lib/api";
import type { Tag } from "@/lib/types";

export default function TagsPage() {
  const [items, setItems] = useState<Tag[]>();
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    api<Tag[]>("/tags", { signal: controller.signal }).then(setItems).catch((cause: Error) => { if (cause.name !== "AbortError") setError(cause.message); });
    return () => controller.abort();
  }, []);
  const results = items?.filter(tag => tag.tagName.toLowerCase().includes(query));

  const pagination = usePagination(results?.length ?? 0);

  return <>
    <PageHeader eyebrow="Directory" title="Tags" description="Browse the labels used to group and filter active tasks." />
    <form className="panel directory-search" onSubmit={event => { event.preventDefault(); pagination.setPage(1); setQuery(name.trim().toLowerCase()); }}><div className="field"><label htmlFor="tag-name">Tag name</label><input id="tag-name" type="search" value={name} onChange={event => setName(event.target.value)} placeholder="Search by name..." /></div><button className="button">Search</button></form>
    {error ? <ErrorState message={error} /> : !results ? <Loading /> : results.length ? <><section className="panel tag-directory" aria-label="Task tags"><Tags tags={results.slice(pagination.start, pagination.end)} /></section><Pagination {...pagination} label="Tags" /></> : <EmptyState text={items?.length ? "No tags match this name." : "No tags have been created yet."} />}
  </>;
}
