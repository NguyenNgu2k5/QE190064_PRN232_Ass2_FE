"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const links = [["/", "Overview"], ["/departments", "Departments"], ["/projects", "Projects"], ["/tasks", "Tasks"], ["/tags", "Tags"], ["/search", "Search"]] as const;
const sections = ["departments", "projects", "tasks", "tags"] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account, loading, logout } = useAuth();
  const management = pathname === "/admin" || pathname.startsWith("/admin/");
  const active = (href: string) => href === "/" || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="topbar">
      <Link href="/" className="brand"><span className="brand-mark">T<span /></span><span>TaskTrack<small>workspace</small></span></Link>
      <nav className="nav-links" aria-label="Main navigation">
        {links.map(([href, label]) => <Link href={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined} key={href}>{label}</Link>)}
        <Link href="/admin" className={`nav-cta${management ? " active" : ""}`}>Manage <span aria-hidden="true">↗</span></Link>
        <div className="as2-account-nav">{loading ? <span className="as2-account-name">Restoring session…</span> : account ? <><span className="as2-account-name" title={account.fullName}>{account.fullName}<small>{account.role === 1 ? "Admin" : "Staff"}</small></span><button className="button secondary" onClick={logout}>Logout</button></> : <><Link href="/login">Login</Link><Link className="button" href="/register">Register</Link></>}</div>
      </nav>
    </header>
    <main className={`content${management ? "" : " public-workspace"}`} id="main-content">{management ? <div className="admin-workspace">
      {account && <nav className="management-nav" aria-label="Management navigation">
        <Link href="/admin" className={active("/admin") ? "active" : ""} aria-current={active("/admin") ? "page" : undefined}>Dashboard</Link>
        {sections.map(section => <Link href={"/admin/" + section} className={active("/admin/" + section) ? "active" : ""} aria-current={active("/admin/" + section) ? "page" : undefined} key={section}>{section.charAt(0).toUpperCase() + section.slice(1)}</Link>)}
        {account.role === 1 && <Link href="/admin/accounts" className={active("/admin/accounts") ? "active" : ""} aria-current={active("/admin/accounts") ? "page" : undefined}>Accounts</Link>}
      </nav>}
      {children}
    </div> : children}</main>
    <footer className="footer"><span><strong>TaskTrack</strong> · PRN232</span><span>Built for focused teams · Public workspace</span></footer>
  </div>;
}
