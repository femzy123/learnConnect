"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import AvatarUploader from "@/components/AvatarUploader";
import CertificatesList from "@/components/CertificatesList";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

export default function TeacherProfileForm({
  userId,
  baseProfile,
  teacherProfile,
  selectedSubjectIds,
  categories,
  subjects,
}) {
  // --- core identity ---
  const [fullName, setFullName] = useState(baseProfile?.full_name || "");
  const [phone, setPhone] = useState(baseProfile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(baseProfile?.avatar_url || "");

  // --- teaching profile ---
  const [bio, setBio] = useState(teacherProfile?.bio || "");
  const [rate, setRate] = useState(
    teacherProfile?.hourly_rate ? String(teacherProfile.hourly_rate / 100) : ""
  );
  const [availability, setAvailability] = useState(
    Array.isArray(teacherProfile?.availability)
      ? teacherProfile.availability.join(", ")
      : ""
  );

  // --- subject selection ---
  const ALL = "all";
  const [categoryId, setCategoryId] = useState(ALL);
  const [subjectIds, setSubjectIds] = useState(
    new Set((selectedSubjectIds || []).map(String))
  );

  // --- verification uploads ---
  const [hasGovtId, setHasGovtId] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [certFile, setCertFile] = useState(null);

  // --- UX / flow ---
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  // Determine if a Government ID already exists (hide the field if so)
  useEffect(() => {
    let alive = true;
    async function checkGovtId() {
      if (!userId) return;
      const { data, error } = await supabase.storage
        .from("vetting_docs")
        .list(`${userId}`, { limit: 100, sortBy: { column: "name", order: "asc" } });
      if (!alive) return;
      if (error) return; // ignore silently
      setHasGovtId((data || []).some((f) => f.name.startsWith("id_")));
    }
    checkGovtId();
    return () => {
      alive = false;
    };
  }, [userId]);

  // Filter subjects by category (sentinel ALL = no filter)
  const filteredSubjects = useMemo(() => {
    if (categoryId === ALL) return subjects;
    return subjects.filter((s) => String(s.category_id) === categoryId);
  }, [subjects, categoryId]);

  function toggleSubject(id) {
    const key = String(id);
    setSubjectIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!fullName.trim() || !phone.trim() || !avatarUrl) {
      setError("Full name, phone number, and profile picture are required.");
      return;
    }
    const rateMinor = Math.round(Number(rate || 0) * 100);
    if (!bio.trim() || !rateMinor || subjectIds.size === 0) {
      setError("Please add a bio, set your hourly rate, and choose at least one subject.");
      return;
    }

    // Buckets
    const idBucket = supabase.storage.from("vetting_docs");   // private (not displayed)
    const certBucket = supabase.storage.from("certificates"); // private (listed via CertificatesList)

    // 1) Save core profile
    const { error: pErr } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
        phone: phone.trim(),
        avatar_url: avatarUrl,
      })
      .eq("id", userId)
      .select()
      .single();
    if (pErr) { setError(pErr.message); return; }

    // 2) Upsert teacher profile; keep 'approved' else set 'pending'
    let vetting_status = teacherProfile?.vetting_status;
    if (vetting_status !== "approved") vetting_status = "pending";

    const availabilityArray = availability
      ? availability.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const { error: tErr } = await supabase.from("teacher_profiles").upsert({
      user_id: userId,
      bio: bio.trim(),
      hourly_rate: rateMinor,
      availability: availabilityArray,
      vetting_status,
    });
    if (tErr) { setError(tErr.message); return; }

    // 3) Replace teacher subjects
    await supabase.from("teacher_subjects").delete().eq("teacher_user_id", userId);
    const toInsert = Array.from(subjectIds).map((id) => ({
      teacher_user_id: userId,
      subject_id: Number(id),
    }));
    if (toInsert.length) {
      const { error: sErr } = await supabase.from("teacher_subjects").insert(toInsert);
      if (sErr) { setError(sErr.message); return; }
    }

    // 4) Upload files (optional)
    const ts = Date.now();
    if (!hasGovtId && idFile) {
      const { error } = await idBucket.upload(`${userId}/id_${ts}_${idFile.name}`, idFile, { upsert: true });
      if (error) { setError(error.message); return; }
    }
    if (certFile) {
      const { error } = await certBucket.upload(`${userId}/cert_${ts}_${certFile.name}`, certFile, { upsert: true });
      if (error) { setError(error.message); return; }
    }

    // Done
    startTransition(() => router.replace("/dashboard/teacher/profile?incomplete=0"));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <AuthErrorAlert title="Couldn’t save your profile" message={error} />

      {/* Identity */}
      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <AvatarUploader userId={userId} currentUrl={avatarUrl} onUploaded={setAvatarUrl} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+234…" />
          </div>
        </div>
      </section>

      {/* Teaching info */}
      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Teaching info</h2>

        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="bio">Short bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="e.g., Experienced JS instructor focusing on beginners"
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="rate">Hourly rate (NGN)</Label>
              <Input
                id="rate"
                type="number"
                inputMode="numeric"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="e.g., 5000"
              />
              <p className="text-xs text-muted-foreground">Stored as minor units (×100).</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="availability">Availability notes</Label>
              <Input
                id="availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g., weekday evenings"
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="grid gap-2">
            <Label htmlFor="category">Filter subjects by category (optional)</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category" className="w-full">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All categories</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subject checkboxes */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredSubjects.map((s) => {
              const id = String(s.id);
              const checked = subjectIds.has(id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-md border p-2">
                  <Checkbox
                    id={`sub-${id}`}
                    checked={checked}
                    onCheckedChange={() => toggleSubject(id)}
                  />
                  <Label htmlFor={`sub-${id}`} className="text-sm">{s.name}</Label>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Verification</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {!hasGovtId && (
            <div className="grid gap-2">
              <Label htmlFor="idFile">Government ID</Label>
              <Input
                id="idFile"
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />
              <p className="text-xs text-muted-foreground">
                Upload once. This is private and not shown publicly.
              </p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="certFile">Certification</Label>
            <Input
              id="certFile"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
            />
            <p className="text-xs text-muted-foreground">
              Add more certificates anytime to strengthen your profile.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <CertificatesList userId={userId} />
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
