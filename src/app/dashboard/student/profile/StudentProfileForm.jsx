"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import AvatarUploader from "@/components/AvatarUploader";

export default function StudentProfileForm({ userId, baseProfile }) {
  const [fullName, setFullName] = useState(baseProfile?.full_name || "");
  const [phone, setPhone] = useState(baseProfile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(baseProfile?.avatar_url || "");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !avatarUrl) {
      setError("Full name, phone number, and profile picture are required.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      setError(error.message);
      return;
    }

    startTransition(() => router.replace("/dashboard/student"));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <AuthErrorAlert title="Couldn’t save your profile" message={error} />

      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AvatarUploader
              userId={userId}
              currentUrl={avatarUrl}
              onUploaded={setAvatarUrl}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="fullName">Full name</label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="phone">Phone number</label>
            <input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
              placeholder="+234…"
            />
          </div>
        </div>
      </section>

      <div className="flex gap-3">
        <Button disabled={pending} type="submit">
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
