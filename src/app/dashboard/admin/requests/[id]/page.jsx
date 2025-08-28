import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin — Request detail" };

async function matchRequestAction(formData) {
  "use server";
  const supabase = await createClient();

  const requestId = String(formData.get("request_id") || "");
  const teacherId = String(formData.get("teacher_id") || "");
  if (!requestId || !teacherId) return;

  // 1) Fetch request (for student_id)
  const { data: req, error: reqErr } = await supabase
    .from("student_requests")
    .select("id, student_id")
    .eq("id", requestId)
    .single();
  if (reqErr || !req) return;

  // 2) Fetch teacher rate (approved only)
  const { data: tprof, error: tErr } = await supabase
    .from("teacher_profiles")
    .select("hourly_rate, vetting_status")
    .eq("user_id", teacherId)
    .single();

  // Must be approved and have a positive rate
  if (tErr || !tprof || tprof.vetting_status !== "approved" || !tprof.hourly_rate || tprof.hourly_rate <= 0) {
    return; // optionally surface an error banner later
  }

  const rateMinor = tprof.hourly_rate; // already minor units in DB

  // 3) Update request → matched
  await supabase
    .from("student_requests")
    .update({ matched_teacher_id: teacherId, status: "matched" })
    .eq("id", requestId);

  // 4) Upsert session with locked rate
  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("request_id", requestId)
    .maybeSingle();

  if (existing?.id) {
    await supabase
      .from("sessions")
      .update({ teacher_id: teacherId, student_id: req.student_id, rate: rateMinor })
      .eq("id", existing.id);
  } else {
    await supabase.from("sessions").insert({
      request_id: requestId,
      teacher_id: teacherId,
      student_id: req.student_id,
      rate: rateMinor,
    });
  }

  // Done
  return redirect("/dashboard/admin/requests");
}

export default async function AdminRequestDetail({ params }) {
  const supabase = await createClient();
  const requestId = params.id;

  const { data: request } = await supabase
    .from("student_requests")
    .select("id, student_id, category_id, subject_id, topic, notes, status, matched_teacher_id, created_at")
    .eq("id", requestId)
    .single();
  if (!request) return notFound();

  const [{ data: cats = [] }, { data: subs = [] }, { data: students = [] }, { data: teachers = [] }] =
    await Promise.all([
      supabase.from("categories").select("id,name"),
      supabase.from("subjects").select("id,name"),
      supabase.from("profiles").select("id,full_name"),
      supabase
        .from("teacher_profiles")
        .select("user_id, vetting_status, hourly_rate, profiles:profiles(full_name)")
        .eq("vetting_status", "approved"),
    ]);

  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const subMap = new Map(subs.map((s) => [s.id, s.name]));
  const userMap = new Map(students.map((s) => [s.id, s.full_name || "Unknown"]));
  const parsedNotes = safeParseJSON(request.notes);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      {/* Request info (unchanged) */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Request detail</h1>
        <p className="text-sm text-muted-foreground">
          Created {new Date(request.created_at).toLocaleString()}
        </p>
      </div>

      <div className="grid gap-4 rounded-2xl border p-4">
        <InfoRow label="Student" value={userMap.get(request.student_id)} />
        <InfoRow label="Category" value={catMap.get(request.category_id)} />
        <InfoRow label="Subject" value={subMap.get(request.subject_id)} />
        <InfoRow label="Topic" value={request.topic} />
        <InfoRow label="Status" value={capitalize(request.status)} />
        <InfoRow label="Goals" value={parsedNotes?.goals || "—"} />
        <InfoRow label="Preferred times" value={parsedNotes?.preferred_times || "—"} />
        <InfoRow label="Budget" value={parsedNotes?.budget || "—"} />
      </div>

      {/* Match section (rate is derived from teacher) */}
      <div className="mt-8 rounded-2xl border p-4">
        <h2 className="mb-4 text-lg font-semibold">Assign teacher</h2>
        <form action={matchRequestAction} className="grid gap-4">
          <input type="hidden" name="request_id" defaultValue={request.id} />
          <div className="grid gap-2">
            <label htmlFor="teacher_id" className="text-sm">Teacher</label>
            <select
              id="teacher_id"
              name="teacher_id"
              className="h-10 w-full rounded-md border bg-background px-3"
              defaultValue={request.matched_teacher_id || ""}
              required
            >
              <option value="" disabled>Select a teacher</option>
              {teachers.map((t) => (
                <option key={t.user_id} value={t.user_id}>
                  {(t.profiles?.full_name || t.user_id) + " — " + formatCurrency(t.hourly_rate) + "/hr"}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Rate is taken from the teacher’s profile and locked into the session at match time.
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="submit">Save & Mark as Matched</Button>
            <Button asChild variant="outline">
              <a href="/dashboard/admin/requests">Back</a>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// helpers (unchanged + currency)
function InfoRow({ label, value }) {
  return (
    <div className="grid grid-cols-3 items-start gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="col-span-2">{value ?? "—"}</div>
    </div>
  );
}
function safeParseJSON(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }
function capitalize(s) { return typeof s === "string" ? s.charAt(0).toUpperCase() + s.slice(1) : s; }
function formatCurrency(minor) {
  const major = (Number(minor || 0) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return `₦${major}`;
}
