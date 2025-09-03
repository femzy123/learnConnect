import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import GovIdViewer from "@/components/admin/GovIdViewer";
import CertificatesList from "@/components/CertificatesList";

export const metadata = { title: "Admin — Vet teacher" };

function formatNGN(minor) {
  const major = Number(minor || 0) / 100;
  return `₦${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}/hr`;
}

// ----- Server actions -----
async function vetAction(formData) {
  "use server";
  const status = String(formData.get("status") || "");
  const teacherId = String(formData.get("teacher_id") || "");
  if (!["approved", "rejected", "pending"].includes(status) || !teacherId) return;

  const supabase = await createClient();
  await supabase.from("teacher_profiles").update({ vetting_status: status }).eq("user_id", teacherId);

  revalidatePath(`/dashboard/admin/teachers/${teacherId}`);
  redirect("/dashboard/admin/teachers");
}

export default async function AdminTeacherDetailPage({ params }) {
  const supabase = await createClient();
  const teacherId = params.id;

  // Load core + teaching info
  const [{ data: p }, { data: t }, { data: ts = [] }, { data: subjects = [] }] = await Promise.all([
    supabase.from("profiles").select("full_name, avatar_url, phone").eq("id", teacherId).maybeSingle(),
    supabase.from("teacher_profiles").select("bio, hourly_rate, availability, vetting_status").eq("user_id", teacherId).maybeSingle(),
    supabase.from("teacher_subjects").select("subject_id").eq("teacher_user_id", teacherId),
    supabase.from("subjects").select("id, name"),
  ]);
  if (!p && !t) return notFound();

  const subjMap = new Map(subjects.map((s) => [s.id, s.name]));
  const subjNames = ts.map((r) => subjMap.get(r.subject_id)).filter(Boolean);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Review teacher</h1>
        <div className="text-sm text-muted-foreground">Vetting status: <strong className="capitalize">{t?.vetting_status || "pending"}</strong></div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={p?.avatar_url || ""} alt={p?.full_name || "Teacher"} />
                <AvatarFallback>
                  {(p?.full_name || "?").split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium">{p?.full_name || teacherId}</div>
                <div className="text-xs text-muted-foreground">{p?.phone || "—"}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-muted-foreground">Hourly rate</div>
                <div className="font-medium">{formatNGN(t?.hourly_rate)}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Subjects</div>
                <div>{subjNames.length ? subjNames.join(", ") : "—"}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Bio</div>
                <div>{t?.bio || "—"}</div>
              </div>
              <div className="text-sm">
                <div className="text-muted-foreground">Availability notes</div>
                <div>{Array.isArray(t?.availability) && t.availability.length ? t.availability.join(", ") : "—"}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-lg font-semibold">Government ID</h2>
            <p className="text-sm text-muted-foreground">Private. Opens in a new tab.</p>
            <GovIdViewer userId={teacherId} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-lg font-semibold">Certificates</h2>
            <p className="text-sm text-muted-foreground">You can view individual files below.</p>
            <CertificatesList userId={teacherId} />
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form action={vetAction}>
          <input type="hidden" name="teacher_id" value={teacherId} />
          <input type="hidden" name="status" value="approved" />
          <Button type="submit" className="w-full sm:w-auto">Approve</Button>
        </form>
        <form action={vetAction}>
          <input type="hidden" name="teacher_id" value={teacherId} />
          <input type="hidden" name="status" value="rejected" />
          <Button type="submit" variant="outline" className="w-full sm:w-auto">Reject</Button>
        </form>
        <form action={vetAction}>
          <input type="hidden" name="teacher_id" value={teacherId} />
          <input type="hidden" name="status" value="pending" />
          <Button type="submit" variant="ghost" className="w-full sm:w-auto">Mark pending</Button>
        </form>
      </div>
    </div>
  );
}
