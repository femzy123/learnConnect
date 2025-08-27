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
    const email = form.email.value.trim();
    const password = form.password.value;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/select-role`,
      },
    });

    if (error) {
      setError(error.message);
      return;
    }

    // If confirmations are on, user may need to verify email first.
    startTransition(() => router.replace("/select-role"));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <AuthErrorAlert title="Sign up failed" message={error} />

      <div className="grid gap-2">
        <label htmlFor="email" className="text-sm">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="h-10 w-full rounded-md border bg-background px-3"
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="password" className="text-sm">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className="h-10 w-full rounded-md border bg-background px-3"
        />
      </div>

      <Button type="submit" disabled={pending} className="h-10">
        {pending ? "Creating account..." : "Sign up"}
      </Button>
    </form>
  );
}
