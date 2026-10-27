"use client";

import { usePathname } from "next/navigation";
import type { User } from "@/lib/api/backend";
import { CategorySidebar } from "./CategorySidebar";
import { PrimarySidebar } from "./PrimarySidebar";
import { TopNavbar } from "./TopNavbar";

interface EnterpriseShellProps {
  user: User;
  children: React.ReactNode;
}

function getBreadcrumb(pathname: string) {
  if (pathname.startsWith("/knowledge")) {
    return [{ label: "Catalog", href: "/knowledge" }, { label: "Knowledge" }];
  }
  if (pathname.startsWith("/projects")) {
    return [{ label: "Agent Studio" }, { label: "Projects" }];
  }
  if (pathname === "/home") {
    return [{ label: "Agent Studio" }, { label: "Dashboard" }];
  }
  return undefined;
}

export function EnterpriseShell({ user, children }: EnterpriseShellProps) {
  const pathname = usePathname();
  const showCategorySidebar = pathname.startsWith("/knowledge");

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-surface">
      <TopNavbar user={user} breadcrumb={getBreadcrumb(pathname)} />
      <div className="flex flex-1 overflow-hidden">
        <PrimarySidebar />
        {showCategorySidebar && <CategorySidebar />}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
