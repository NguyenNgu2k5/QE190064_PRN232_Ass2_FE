"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./AuthProvider";

const links = [["/", "Overview"], ["/departments", "Departments"], ["/projects", "Projects"], ["/tasks", "Tasks"], ["/tags", "Tags"], ["/search", "Search"]] as const;
const sections = ["departments", "projects", "tasks", "tags"] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { account, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const management = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/profile";
  const active = (href: string) => href === "/" || href === "/admin" ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  const accountNavigation = <div className="as2-account-nav">{loading ? <span className="as2-account-name">Restoring session…</span> : account ? <><Link href="/profile" aria-current={pathname === "/profile" ? "page" : undefined}>Profile</Link><span className="as2-account-name" title={account.fullName}>{account.fullName}<small>{account.role === 1 ? "Admin" : "Staff"}</small></span><button className="button secondary" onClick={logout}>Logout</button></> : <><Link href="/login">Login</Link><Link className="button" href="/register">Register</Link></>}</div>;
  return <div className={`app-shell${management ? " management-shell" : ""}`}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="topbar">
      <Link href={management ? "/admin" : "/"} className="brand"><span className="brand-mark">T<span /></span><span>TaskTrack<small>{management ? "Management" : "workspace"}</small></span></Link>
      {!management && <nav className="nav-links" aria-label="Main navigation">
          {links.map(([href, label]) => <Link href={href} className={active(href) ? "active" : ""} aria-current={active(href) ? "page" : undefined} key={href}>{label}</Link>)}
          <Link href="/admin" className="nav-cta">Manage <span aria-hidden="true">↗</span></Link>
          {accountNavigation}
      </nav>}
      {management && <div className="workspace-actions"><Link href="/" className="public-site-link">View public site <span aria-hidden="true">↗</span></Link>{accountNavigation}</div>}
    </header>
    {management ? <div className="management-body">
      <aside className={`management-sidebar${menuOpen ? " is-open" : ""}`}>
        {account && <><p className="sidebar-label">Workspace</p><button type="button" className="workspace-menu-toggle" aria-controls="workspace-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(value => !value)}>Workspace menu <span aria-hidden="true">{menuOpen ? "−" : "+"}</span></button>
          <nav className="workspace-nav" id="workspace-navigation" aria-label="Management navigation">
            <Link href="/admin" className={active("/admin") ? "active" : ""} aria-current={active("/admin") ? "page" : undefined} onClick={() => setMenuOpen(false)}>Dashboard</Link>
            {sections.map(section => <Link href={"/admin/" + section} className={active("/admin/" + section) ? "active" : ""} aria-current={active("/admin/" + section) ? "page" : undefined} onClick={() => setMenuOpen(false)} key={section}>{section.charAt(0).toUpperCase() + section.slice(1)}</Link>)}
            {account.role === 1 && <Link href="/admin/accounts" className={active("/admin/accounts") ? "active" : ""} aria-current={active("/admin/accounts") ? "page" : undefined} onClick={() => setMenuOpen(false)}>Accounts</Link>}
          </nav>
        </>}
      </aside>
      <main className="content" id="main-content"><div className="admin-workspace">{children}</div></main>
    </div> : <main className="content" id="main-content">{children}</main>}
    <footer className="footer"><span><strong>TaskTrack</strong> · PRN232</span><span>Built for focused teams · {management ? "Management workspace" : "Public workspace"}</span></footer>
  </div>;
}
