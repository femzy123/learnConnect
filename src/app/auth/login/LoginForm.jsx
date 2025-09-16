"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";

export default function LoginForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const email = form.email.value.trim();
    const password = form.password.value;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); return; }

    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) { setError("Login failed."); return; }

    // Look up role + profile completeness
    const { data: profile } = await supabase
    .from("profiles")
    .select("role, avatar_url, phone, account_status")
      .eq("id", user.id)
      .single();

    if (profile?.account_status === "deactivated") {
    startTransition(() => router.replace("/auth/deactivated"));
    return;
  }

    let dest = "/auth/select-role";
    if (profile?.role === "admin") dest = "/dashboard/admin";
    if (profile?.role === "student") {
      const incomplete = !profile.avatar_url || !profile.phone;
      dest = incomplete ? "/dashboard/student/profile" : "/dashboard/student";
    }
    if (profile?.role === "teacher") {
      const { data: tprof } = await supabase
        .from("teacher_profiles")
        .select("bio, hourly_rate")
        .eq("user_id", user.id)
        .maybeSingle();
      const incomplete =
        !profile.avatar_url || !profile.phone || !tprof?.bio || !tprof?.hourly_rate;
      dest = incomplete ? "/dashboard/teacher/profile" : "/dashboard/teacher";
    }

    startTransition(() => router.replace(dest));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <AuthErrorAlert title="Login failed" message={error} />
      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm">Email</label>
        <input id="email" name="email" type="email" required className="h-10 rounded-md border bg-background px-3 w-full" />
      </div>
      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm">Password</label>
        <input id="password" name="password" type="password" required className="h-10 rounded-md border bg-background px-3 w-full" />
      </div>
      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Signing in..." : "Log in"}
      </Button>
    </form>
  );
}
