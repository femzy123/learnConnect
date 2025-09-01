"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import { Button } from "@/components/ui/button";

export default function SignupForm() {
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const fullName = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (!fullName) {
      setError("Please enter your name.");
      return;
    }

    // 1) Create auth user and store name in user metadata
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }, // <-- saved in auth metadata
        emailRedirectTo: `${
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
        }/auth/select-role`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    // 2) Best-effort: if we have a session right away, also write to profiles now.
    // (Otherwise, the DB trigger already inserted profiles with full_name.)
    if (data?.session?.access_token && data.user?.id) {
      await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", data.user.id)
        .select()
        .maybeSingle();
    }

    // 3) Continue to role selection
    startTransition(() => router.replace("/auth/select-role"));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <AuthErrorAlert title="Sign up failed" message={error} />

      <div className="grid gap-2">
        <label htmlFor="name" className="text-sm">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="h-10 w-full rounded-md border bg-background px-3"
          placeholder="Your full name"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-10 w-full rounded-md border bg-background px-3"
          placeholder="you@example.com"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          className="h-10 w-full rounded-md border bg-background px-3"
        />
      </div>

      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Creating account..." : "Sign up"}
      </Button>
    </form>
  );
}
