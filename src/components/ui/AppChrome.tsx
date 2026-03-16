"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBook, IconHome, IconInfoCircle, IconLibrary, IconMusic, IconSettings } from "@tabler/icons-react";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/", label: "Home", icon: IconHome },
  { href: "/practice", label: "Practice", icon: IconBook },
  { href: "/jazz", label: "Jazz", icon: IconMusic },
  { href: "/library", label: "Library", icon: IconLibrary }
];

export default function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__header-inner">
          <Link href="/" className="brand">
            <span className="brand__mark">NL</span>
            <span>
              <strong>NoteLyric</strong>
              <small>Practice Harmonically</small>
            </span>
          </Link>

          <nav className="app-shell__utility-nav" aria-label="Secondary">
            <Link href="/settings" className={isActive("/settings") ? "utility-link utility-link--active" : "utility-link"}>
              <IconSettings size={16} />
              Settings
            </Link>
            <Link href="/about" className={isActive("/about") ? "utility-link utility-link--active" : "utility-link"}>
              <IconInfoCircle size={16} />
              About
            </Link>
          </nav>
        </div>
      </header>

      <main className="app-shell__main">
        <div className="app-shell__content">{children}</div>
      </main>

      <nav className="bottom-nav" aria-label="Primary">
        {LINKS.map((item) => (
          <Link key={item.href} href={item.href} className={isActive(item.href) ? "bottom-nav__link bottom-nav__link--active" : "bottom-nav__link"}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <footer className="app-shell__footer">
        <p>NoteLyric</p>
        <p>Copyright (c) {year} Farshad Jafarzadeh</p>
      </footer>
    </div>
  );
}

