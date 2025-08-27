"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu } from "lucide-react";

export default function SiteHeader({ user }) {
  const isAuthed = !!user;
  const role = user?.user_metadata?.role;

  const dashboardHref = useMemo(() => {
    if (role === "teacher") return "/dashboard/teacher";
    if (role === "admin") return "/dashboard/admin";
    return "/dashboard/student";
  }, [role]);

  const NavLinks = () => (
    <nav className="flex items-center gap-2">
      {!isAuthed ? (
        <>
          <Button variant="ghost" asChild>
            <Link href="/auth/login">Log in</Link>
          </Button>
          <Button asChild>
            <Link href="/auth/signup">Get started</Link>
          </Button>
        </>
      ) : (
        <Button asChild>
          <Link href={dashboardHref}>Dashboard</Link>
        </Button>
      )}
    </nav>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold tracking-tight">LearnConect</Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">
            How it works
          </Link>
          <Link href="#categories" className="text-sm text-muted-foreground hover:text-foreground">
            Categories
          </Link>
          <NavLinks />
        </div>

        {/* Mobile dropdown nav */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-2">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Menu
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="#how-it-works">How it works</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="#categories">Categories</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/faq">FAQs</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {!isAuthed ? (
                <div className="flex gap-2 p-2">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href="/auth/login">Log in</Link>
                  </Button>
                  <Button className="flex-1" asChild>
                    <Link href="/auth/signup">Get started</Link>
                  </Button>
                </div>
              ) : (
                <div className="p-2">
                  <Button className="w-full" asChild>
                    <Link href={dashboardHref}>Dashboard</Link>
                  </Button>
                </div>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
