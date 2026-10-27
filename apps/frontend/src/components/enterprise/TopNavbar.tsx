"use client";

import { Bell, ChevronRight, HelpCircle, Moon, Search } from "lucide-react";
import Link from "next/link";
import type { User } from "@/lib/api/backend";
import { WebSocketStatus } from "@/components/auth/WebSocketStatus";
import { UserMenu } from "./UserMenu";

interface TopNavbarProps {
  user: User;
  breadcrumb?: { label: string; href?: string }[];
}

export function TopNavbar({ user, breadcrumb }: TopNavbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-4 border-b border-surface-border bg-surface-raised px-4">
      <Link href="/home" className="flex items-center gap-2 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent font-bold text-white text-sm">
          R
        </div>
        <span className="hidden font-semibold text-content-primary sm:block">RAG Platform</span>
      </Link>

      <div className="relative hidden max-w-md flex-1 md:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          type="search"
          placeholder="Search menu..."
          className="w-full rounded-md border border-surface-border bg-surface-overlay py-1.5 pl-9 pr-3 text-sm text-content-primary placeholder:text-content-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
      </div>

      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="hidden items-center gap-1 text-sm text-content-secondary lg:flex">
          {breadcrumb.map((item, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-content-muted" />}
              {item.href ? (
                <Link href={item.href} className="hover:text-content-primary">{item.label}</Link>
              ) : (
                <span className="text-content-primary">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}

      <div className="ml-auto flex items-center gap-2">
        <WebSocketStatus />
        <button type="button" className="rounded-md p-2 text-content-secondary hover:bg-surface-hover hover:text-content-primary" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>
        <button type="button" className="rounded-md p-2 text-content-secondary hover:bg-surface-hover hover:text-content-primary" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </button>
        <button type="button" className="rounded-md p-2 text-content-secondary hover:bg-surface-hover hover:text-content-primary" aria-label="Theme">
          <Moon className="h-4 w-4" />
        </button>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
