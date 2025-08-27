"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client"; // your existing helper
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
    if (error) {
      setError(error.message);
      return;
    }

    // Determine destination based on profile role
    const { data: { user } = {} } = await supabase.auth.getUser();
    let dest = "/";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      dest = profile?.role ? `/dashboard/${profile.role}` : "/auth/select-role";
    }

    startTransition(() => router.replace(dest));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <AuthErrorAlert title="Login failed" message={error} />

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-10 rounded-md border bg-background px-3"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-10 rounded-md border bg-background px-3"
        />
      </div>

      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Signing in..." : "Log in"}
      </Button>
    </form>
  );
}
