"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState, Loading, PageHeader, Tags } from "@/components/ui";
import { api } from "@/lib/api";
import type { Tag } from "@/lib/types";

export default function TagsPage() {
  const [items, setItems] = useState<Tag[]>();
  const [error, setError] = useState("");

  useEffect(() => { api<Tag[]>("/tags").then(setItems).catch((e) => setError(e.message)); }, []);

  return <><PageHeader eyebrow="Directory" title="Tags" description="Browse the labels used to group and filter active tasks." action={<Link className="button" href="/admin/tags">Manage tags</Link>} />{error ? <ErrorState message={error} /> : !items ? <Loading /> : items.length ? <section className="panel tag-directory" aria-label="Task tags"><Tags tags={items} /></section> : <EmptyState text="No tags have been created yet." />}</>;
}
