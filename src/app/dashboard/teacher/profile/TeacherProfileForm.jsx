"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import AvatarUploader from "@/components/AvatarUploader";
import CertificatesList from "@/components/CertificatesList";

export default function TeacherProfileForm({
  userId,
  baseProfile,
  teacherProfile,
  selectedSubjectIds,
  categories,
  subjects,
}) {
  const [fullName, setFullName] = useState(baseProfile?.full_name || "");
  const [phone, setPhone] = useState(baseProfile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(baseProfile?.avatar_url || "");
  const [bio, setBio] = useState(teacherProfile?.bio || "");
  const [rate, setRate] = useState(
    teacherProfile?.hourly_rate
      ? (teacherProfile.hourly_rate / 100).toString()
      : ""
  );
  const [availability, setAvailability] = useState(
    Array.isArray(teacherProfile?.availability)
      ? teacherProfile.availability.join(", ")
      : ""
  );
  const [categoryId, setCategoryId] = useState("");
  const [subjectIds, setSubjectIds] = useState(
    new Set(selectedSubjectIds || [])
  );
  const [idFile, setIdFile] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filteredSubjects = useMemo(
    () =>
      categoryId
        ? subjects.filter((s) => s.category_id === categoryId)
        : subjects,
    [subjects, categoryId]
  );

  function toggleSubject(id) {
    setSubjectIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !phone.trim() || !avatarUrl) {
      setError("Full name, phone number, and profile picture are required.");
      return;
    }

    const rateMinor = Math.round(Number(rate || 0) * 100);
    if (!bio.trim() || !rateMinor || subjectIds.size === 0) {
      setError(
        "Please provide your bio, hourly rate, and select at least one subject."
      );
      return;
    }


    // 1) Save core profile (name, phone, avatar)
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
    if (pErr) {
      setError(pErr.message);
      return;
    }

    // 2) Upsert teacher profile; keep 'approved' else set 'pending'
    let vetting_status = teacherProfile?.vetting_status;
    if (vetting_status !== "approved") vetting_status = "pending";

    const availabilityArray = availability
      ? availability
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    const { error: tErr } = await supabase.from("teacher_profiles").upsert({
      user_id: userId,
      bio: bio.trim(),
      hourly_rate: rateMinor,
      availability: availabilityArray,
      vetting_status,
    });
    if (tErr) {
      setError(tErr.message);
      return;
    }

    // 3) Replace teacher subjects
    const toInsert = Array.from(subjectIds).map((id) => ({
      teacher_user_id: userId,
      subject_id: id,
    }));
    await supabase
      .from("teacher_subjects")
      .delete()
      .eq("teacher_user_id", userId);
    if (toInsert.length) {
      const { error: sErr } = await supabase
        .from("teacher_subjects")
        .insert(toInsert);
      if (sErr) {
        setError(sErr.message);
        return;
      }
    }

    // 4) Upload new files (optional)
    const idBucket = supabase.storage.from("vetting_docs");
    const certBucket = supabase.storage.from("certificates");
    const ts = Date.now();
    if (idFile) {
      const { error } = await idBucket.upload(
        `${userId}/id_${ts}_${idFile.name}`,
        idFile,
        { upsert: true }
      );
      if (error) {
        setError(error.message);
        return;
      }
    }
    if (certFile) {
      const { error } = await certBucket.upload(
        `${userId}/cert_${ts}_${certFile.name}`,
        certFile,
        { upsert: true }
      );
      if (error) {
        setError(error.message);
        return;
      }
    }

    startTransition(() => router.replace("/dashboard/teacher"));
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <AuthErrorAlert title="Couldn’t save your profile" message={error} />

      {/* Identity */}
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
            <label className="text-sm" htmlFor="fullName">
              Full name
            </label>
            <input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="phone">
              Phone number
            </label>
            <input
              id="phone"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
              placeholder="+234…"
            />
          </div>
        </div>
      </section>

      {/* Teaching info */}
      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Teaching info</h2>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="bio">
              Short bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="min-h-[100px] w-full rounded-md border bg-background p-3"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <label className="text-sm" htmlFor="rate">
                Hourly rate (NGN)
              </label>
              <input
                id="rate"
                inputMode="numeric"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3"
                placeholder="e.g., 5000"
              />
              <p className="text-xs text-muted-foreground">
                Stored as minor units (×100).
              </p>
            </div>
            <div className="grid gap-2">
              <label className="text-sm" htmlFor="availability">
                Availability notes
              </label>
              <input
                id="availability"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                className="h-10 w-full rounded-md border bg-background px-3"
                placeholder="e.g., weekday evenings"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <label className="text-sm" htmlFor="category">
              Filter subjects by category (optional)
            </label>
            <select
              id="category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-md border bg-background px-3"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {(categoryId
              ? subjects.filter((s) => s.category_id === categoryId)
              : subjects
            ).map((s) => (
              <label
                key={s.id}
                className="flex items-center gap-2 rounded-md border p-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={subjectIds.has(s.id)}
                  onChange={() => toggleSubject(s.id)}
                />
                {s.name}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* Verification */}
      <section className="rounded-2xl border p-4">
        <h2 className="mb-3 text-lg font-semibold">Verification</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="idFile">
              Government ID
            </label>
            <input
              id="idFile"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm" htmlFor="certFile">
              Certification
            </label>
            <input
              id="certFile"
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(e) => setCertFile(e.target.files?.[0] || null)}
            />
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
