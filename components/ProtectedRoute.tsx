"use client";
import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Loading } from "./ui";

export function ProtectedRoute({ children, adminOnly = false }: { children: ReactNode; adminOnly?: boolean }) {
  const { account, loading } = useAuth();
  const router = useRouter();
  useEffect(() => { if (!loading && !account) router.replace("/login"); }, [account, loading, router]);
  if (loading || !account) return <Loading />;
  if (adminOnly && account.role !== 1) return <section className="panel access-denied"><h1>Admin access required</h1><p>Your Staff account can manage departments, projects, tasks and tags.</p><Link className="button" href="/admin">Return to dashboard</Link></section>;
  return <>{children}</>;
}
