"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, ListPlus, MessagesSquare, Users, CreditCard } from "lucide-react";
import UserMenu from "./UserMenu";

/**
 * Sidebar + header shell. Pass {role, profile, user} and children.
 */
export default function DashboardShell({ role, profile, user, children }) {
  const pathname = usePathname();

  const navByRole = {
    student: [
      { label: "Overview", href: "/dashboard/student", icon: LayoutDashboard },
      { label: "Profile",  href: "/dashboard/student/profile", icon: LayoutDashboard },
      { label: "New request", href: "/dashboard/student/request", icon: ListPlus },
      // { label: "Messages", href: "/dashboard/student/messages", icon: MessagesSquare }, // later
    ],
    teacher: [
      { label: "Overview", href: "/dashboard/teacher", icon: LayoutDashboard },
      { label: "Profile",    href: "/dashboard/teacher/profile", icon: LayoutDashboard },
      // { label: "Sessions", href: "/dashboard/teacher/sessions", icon: MessagesSquare }, // later
    ],
    admin: [
      { label: "Overview", href: "/dashboard/admin", icon: LayoutDashboard },
      { label: "Requests", href: "/dashboard/admin/requests", icon: ListPlus },
      { label: "Teachers", href: "/dashboard/admin/teachers", icon: Users },
      { label: "Payments", href: "/dashboard/admin/payments", icon: CreditCard },
    ],
  };

  const items = navByRole[role] || [];

  return (
    <div className="grid min-h-screen md:grid-cols-[240px_1fr]">
      {/* Sidebar */}
      <aside className="hidden border-r bg-background md:block">
        <div className="sticky top-0 flex h-screen flex-col">
          <div className="px-4 py-4">
            <Link href="/" className="font-semibold tracking-tight">LearnConect</Link>
          </div>
          <Separator />
          <nav className="flex-1 space-y-1 px-2 py-4 text-sm">
            {items.map(({ label, href, icon: Icon }) => {
              const active =
                pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={[
                    "flex items-center gap-2 rounded-md px-3 py-2",
                    active ? "bg-accent font-medium" : "hover:bg-accent",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="px-3 pb-4">
            <Button asChild variant="outline" className="w-full">
              <Link href="/">Back to site</Link>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
            <div className="text-sm text-muted-foreground">
              {role === "admin" ? "Admin" : role?.charAt(0).toUpperCase() + role?.slice(1)} Dashboard
            </div>
            <UserMenu profile={profile} user={user} />
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}
