"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut } from "lucide-react";

export default function UserMenu({ profile, user }) {
  const router = useRouter();
  const name = profile?.full_name || "";
  const email = user?.email || "";
  const avatar = profile?.avatar_url || "";

  async function onLogout() {
    await supabase.auth.signOut();
    router.replace("/"); // landing
  }

  const initials = (name || email || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none">
        <div className="flex items-center gap-3 rounded-full px-2 py-1 hover:bg-accent">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatar} alt={name || email} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="hidden text-left md:block">
            <div className="text-sm font-medium leading-tight">{name || email}</div>
            <div className="text-xs text-muted-foreground truncate max-w-[180px]">{email}</div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Signed in</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {/* Hook up later if you add a settings page */}
        {/* <DropdownMenuItem asChild><a href="/dashboard/settings">Settings</a></DropdownMenuItem> */}
        <DropdownMenuItem onClick={onLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
