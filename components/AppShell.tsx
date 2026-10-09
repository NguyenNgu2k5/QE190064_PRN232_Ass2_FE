"use client";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { Icon, type IconName } from "./Icon";

const links = [["/", "Overview", "overview"], ["/departments", "Departments", "departments"], ["/projects", "Projects", "projects"], ["/tasks", "Tasks", "tasks"], ["/tags", "Tags", "tags"], ["/search", "Search", "search"]] as const;
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account, loading, logout } = useAuth();
  const active = (href: string) => href === "/" || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const current = pathname.startsWith("/admin") ? "Management" : pathname === "/login" || pathname === "/register" ? "Account access" : "Workspace";
  return <div className="app-shell"><a className="skip-link" href="#main-content">Skip to content</a>
    <aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark">T</span><span>TaskTrack<small>Team workspace</small></span></Link>
      <p className="nav-group-label">EXPLORE</p><nav className="sidebar-nav" aria-label="Public navigation">{links.map(([href, label, icon]) => <Link href={href} key={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined}><Icon name={icon} /><span>{label}</span></Link>)}</nav>
      {account && <><p className="nav-group-label">MANAGE</p><nav className="sidebar-nav" aria-label="Management navigation"><Link href="/admin" className={active("/admin") ? "active" : ""}><Icon name="overview" /><span>Dashboard</span></Link>{(["departments", "projects", "tasks", "tags"] as const).map((section) => <Link href={"/admin/" + section} className={active("/admin/" + section) ? "active" : ""} key={section}><Icon name={section as IconName} /><span>{section.charAt(0).toUpperCase() + section.slice(1)}</span></Link>)}{account.role === 1 && <Link href="/admin/accounts" className={active("/admin/accounts") ? "active" : ""}><Icon name="accounts" /><span>Accounts</span></Link>}</nav></>}
      <div className="sidebar-footer"><span className="sidebar-dot" />{account ? "Signed in · " + (account.role === 1 ? "Admin" : "Staff") : "Public workspace"}</div>
    </aside>
    <div className="workspace"><header className="topbar"><div className="breadcrumbs"><span>TaskTrack</span><span aria-hidden="true">/</span><strong>{current}</strong></div><div className="account-navigation">{loading ? <span className="muted">Restoring session…</span> : account ? <><span className="avatar" aria-hidden="true">{account.fullName.slice(0, 1).toUpperCase()}</span><span className="account-name">{account.fullName}<small>{account.role === 1 ? "Admin" : "Staff"}</small></span><button className="button secondary" onClick={logout}>Logout</button></> : <><Link className="button secondary" href="/login">Login</Link><Link className="button" href="/register">Register</Link></>}</div></header>
      <main className="content" id="main-content">{children}</main><footer className="footer"><span>TaskTrack · Task & team management</span><Link href="/search">Find a task →</Link></footer>
    </div></div>;
}
