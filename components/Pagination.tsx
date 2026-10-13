"use client";

import { useState } from "react";

// shortcut: paging uses full-list API responses, move paging to the API when lists become large.
export function usePagination(total: number, pageSize = 6) {
  const [requestedPage, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(requestedPage, pageCount);
  const start = (page - 1) * pageSize;
  return { page, pageCount, total, start, end: Math.min(start + pageSize, total), setPage };
}

export function Pagination({ page, pageCount, total, start, end, setPage, label }: ReturnType<typeof usePagination> & { label: string }) {
  if (!total) return null;
  const firstPage = Math.max(1, Math.min(page - 2, pageCount - 4));
  return <div className="pagination">
    <div className="pagination-summary"><span role="status" aria-live="polite" aria-atomic="true">Showing <strong>{start + 1}–{end}</strong> of <strong>{total}</strong> {label.toLowerCase()}</span><small>Page {page} of {pageCount}</small></div>
    <nav className="pagination-controls" aria-label={`${label} pagination`}>
      <button type="button" className="pagination-step" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
      {Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index).map(number => <button type="button" className="pagination-number" key={number} aria-label={`Page ${number}`} aria-current={page === number ? "page" : undefined} onClick={() => setPage(number)}>{number}</button>)}
      <button type="button" className="pagination-step" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button>
    </nav>
  </div>;
}
