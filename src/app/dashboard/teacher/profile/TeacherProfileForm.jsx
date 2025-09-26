"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import AvatarUploader from "@/components/AvatarUploader";
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

import CertificatesList from '@/components/CertificatesList'

const MAX_CERT_SIZE = 10 * 1024 * 1024; // 10 MB
const CERT_TYPES = [
  "image/png", "image/jpeg", "image/jpg", "application/pdf",
];

/**
 * Props:
 * - userId: string
 * - baseProfile: { full_name, phone, avatar_url }
 * - teacherProfile: { bio, vetting_status } | null
 * - selectedSubjectIds: number[]
 * - categories: { id, name }[]
 * - subjects: { id, category_id, name }[]
 */
export default function TeacherProfileForm({
  userId,
  baseProfile,
  teacherProfile,
  selectedSubjectIds,
  categories,
  subjects,
}) {
  // Identity
  const [fullName, setFullName] = useState(baseProfile?.full_name || "");
  const [phone, setPhone] = useState(baseProfile?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(baseProfile?.avatar_url || "");
  // Teaching profile
  const [bio, setBio] = useState(teacherProfile?.bio || "");
  // Subject selection
  const ALL = "all";
  const [categoryId, setCategoryId] = useState(ALL);
  const [subjectIds, setSubjectIds] = useState(
    new Set((selectedSubjectIds || []).map(String))
  );

  // Files
  const [hasGovtId, setHasGovtId] = useState(false);
  const [idFile, setIdFile] = useState(null);
  const [certFiles, setCertFiles] = useState([]); // ← multiple
  const [certs, setCerts] = useState([]); // { name, size, path, signedUrl? }

  // UX
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const idBucket = supabase.storage.from("vetting_docs");   // private
  const certBucket = supabase.storage.from("certificates"); // private

  // Check for existing Gov ID + list certificates
  useEffect(() => {
    let alive = true;
    async function bootstrap() {
      if (!userId) return;

      // Gov ID?
      const { data: idList } = await idBucket.list(`${userId}`, {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      });
      if (!alive) return;
      setHasGovtId((idList || []).some((f) => f.name.startsWith("id_")));

      // Certs list
      const { data: certList } = await certBucket.list(`${userId}`, {
        limit: 100,
        sortBy: { column: "name", order: "desc" },
      });
      if (!alive) return;
      setCerts(
        (certList || []).map((f) => ({
          name: f.name,
          size: f.metadata?.size ?? null,
          path: `${userId}/${f.name}`,
        }))
      );
    }
    bootstrap();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Sign a URL on demand
  async function getSignedUrl(path) {
    const { data, error } = await certBucket.createSignedUrl(path, 60); // 60s
    if (error) throw new Error(error.message);
    return data.signedUrl;
  }

  function toggleSubject(id) {
    const key = String(id);
    setSubjectIds((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function onPickCertificates(e) {
    const files = Array.from(e.currentTarget.files || []);
    // filter by size/type
    const valid = [];
    for (const f of files) {
      if (f.size > MAX_CERT_SIZE) {
        setError(`"${f.name}" is larger than ${Math.round(MAX_CERT_SIZE/1024/1024)}MB.`);
        continue;
      }
      if (!CERT_TYPES.includes(f.type)) {
        setError(`"${f.name}" has unsupported type (${f.type}).`);
        continue;
      }
      valid.push(f);
    }
    setCertFiles((prev) => [...prev, ...valid]);
    // reset input
    e.currentTarget.value = "";
  }

  async function uploadCertificates() {
    if (!certFiles.length) return;
    setUploading(true);
    setError("");

    const ts = Date.now();
    for (const f of certFiles) {
      const safe = f.name.replace(/\s+/g, "_");
      const path = `${userId}/cert_${ts}_${safe}`;
      const { error } = await certBucket.upload(path, f, { upsert: false });
      if (error) {
        setUploading(false);
        setError(error.message);
        return;
      }
    }
    // refresh list
    const { data: certList, error: lerr } = await certBucket.list(`${userId}`, {
      limit: 100,
      sortBy: { column: "name", order: "desc" },
    });
    if (!lerr) {
      setCerts(
        (certList || []).map((f) => ({
          name: f.name,
          size: f.metadata?.size ?? null,
          path: `${userId}/${f.name}`,
        }))
      );
    }
    setCertFiles([]);
    setUploading(false);
  }

  async function deleteCertificate(path) {
    setError("");
    const { error } = await certBucket.remove([path]);
    if (error) { setError(error.message); return; }
    setCerts((prev) => prev.filter((c) => c.path !== path));
  }

  // Filter subjects by category
  const filteredSubjects = useMemo(() => {
    if (categoryId === ALL) return subjects;
    return subjects.filter((s) => String(s.category_id) === categoryId);
  }, [subjects, categoryId]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    // Validation (no global rate in V2)
    if (!fullName.trim() || !phone.trim() || !avatarUrl) {
      setError("Full name, phone number, and profile picture are required.");
      return;
    }
    if (!bio.trim() || subjectIds.size === 0) {
      setError("Please add a short bio and select at least one subject.");
      return;
    }

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

    // 2) Upsert teacher profile; keep approved if already approved
    let vetting_status = teacherProfile?.vetting_status;
    if (vetting_status !== "approved") vetting_status = "pending";

    const { error: tErr } = await supabase.from("teacher_profiles").upsert({
      user_id: userId,
      bio: bio.trim(),
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

    // 4) Upload Gov ID (once)
    if (!hasGovtId && idFile) {
      const ts = Date.now();
      const safe = idFile.name.replace(/\s+/g, "_");
      const { error } = await idBucket.upload(`${userId}/id_${ts}_${safe}`, idFile, { upsert: false });
      if (error) { setError(error.message); return; }
      setHasGovtId(true);
      setIdFile(null);
    }

    // 5) Upload any pending certificates
    if (certFiles.length) await uploadCertificates();

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

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {filteredSubjects.map((s) => {
              const id = String(s.id);
              const checked = subjectIds.has(id);
              return (
                <div key={id} className="flex items-center gap-2 rounded-md border p-2">
                  <Checkbox id={`sub-${id}`} checked={checked} onCheckedChange={() => toggleSubject(id)} />
                  <Label htmlFor={`sub-${id}`} className="text-sm">
                    {s.name}
                  </Label>
                </div>
              );
            })}
            {filteredSubjects.length === 0 && (
              <p className="text-sm text-muted-foreground">No subjects in this category yet.</p>
            )}
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
              <p className="text-xs text-muted-foreground">Upload once. This is private and not shown publicly.</p>
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="certFiles">Certifications</Label>
            <Input
              id="certFiles"
              type="file"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={onPickCertificates}
            />
            {certFiles.length > 0 && (
              <div className="rounded-md border p-2 text-xs">
                <div className="mb-1 font-medium">Ready to upload:</div>
                <ul className="list-disc pl-4">
                  {certFiles.map((f, i) => (
                    <li key={i}>{f.name} — {(f.size/1024/1024).toFixed(2)} MB</li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <Button type="button" onClick={uploadCertificates} disabled={uploading}>
                    {uploading ? "Uploading…" : "Upload"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setCertFiles([])} disabled={uploading}>
                    Clear list
                  </Button>
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Add multiple files. Max {Math.round(MAX_CERT_SIZE/1024/1024)}MB each.</p>
          </div>
        </div>

        {/* Certificates list */}
        {/* <div className="mt-4 rounded-2xl border">
          <div className="bg-muted/50 px-3 py-2 text-xs text-muted-foreground">Uploaded certificates</div>
          {certs.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">No certificates uploaded yet.</div>
          ) : (
            <ul className="divide-y">
              {certs.map((c) => (
                <li key={c.path} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{c.name}</div>
                    {c.size ? <div className="text-xs text-muted-foreground">{(c.size/1024/1024).toFixed(2)} MB</div> : null}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          const url = await getSignedUrl(c.path);
                          window.open(url, "_blank", "noopener,noreferrer");
                        } catch (e) {
                          setError(e.message);
                        }
                      }}
                    >
                      Download
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCertificate(c.path)}
                    >
                      Delete
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div> */}
        <CertificatesList userId={userId} />
      </section>

      <div className="flex gap-3">
        <Button disabled={pending || uploading} type="submit">
          {pending ? "Saving..." : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
