import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuthErrorAlert from "@/components/AuthErrorAlert";

// helper
function toISOorNull(v) {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(+d) ? null : d.toISOString();
}

async function saveSlotsAction(prevState, formData) {
  "use server";
  const supabase = await createClient();

  const sessionId = String(formData.get("session_id") || "");
  const slot1 = toISOorNull(formData.get("slot1"));
  const slot2 = toISOorNull(formData.get("slot2"));
  const slot3 = toISOorNull(formData.get("slot3"));

  const slots = [slot1, slot2, slot3].filter(Boolean);
  if (!sessionId || slots.length === 0) return { error: "Provide at least one valid time." };

  const { data: s } = await supabase
    .from("sessions")
    .select("id, request:student_requests(matched_teacher_id)")
    .eq("id", sessionId)
    .single();

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!s || !user || s.request?.matched_teacher_id !== user.id) {
    return { error: "You don’t have access to this session." };
  }

  const { error } = await supabase
    .from("sessions")
    .update({ proposed_slots: slots })
    .eq("id", sessionId);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/teacher/sessions/${sessionId}`);
  return { ok: true };
}

export const metadata = { title: "Propose times — LearnConect" };

export default async function TeacherSessionDetailPage({ params }) {
  const pr = await params; // Next 15 pattern
  const sessionId = pr.id;

  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: s } = await supabase
    .from("sessions")
    .select("id, rate, proposed_slots, scheduled_time, request:student_requests(id, topic, status, matched_teacher_id)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!s) return notFound();
  if (s.request?.matched_teacher_id !== user.id) redirect("/dashboard/teacher");

  const amount = `₦${(Number(s.rate || 0)/100).toLocaleString()}/hr`;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Propose times</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/teacher/sessions">← Back to sessions</Link>
        </Button>
      </div>

      <div className="rounded-2xl border p-4 space-y-2 text-sm">
        <div><span className="text-muted-foreground">Topic:</span> <strong>{s.request?.topic}</strong></div>
        <div><span className="text-muted-foreground">Rate:</span> <strong>{amount}</strong></div>
        {s.scheduled_time && (
          <div><span className="text-muted-foreground">Scheduled for:</span> <strong>{new Date(s.scheduled_time).toLocaleString()}</strong></div>
        )}
      </div>

      {Array.isArray(s.proposed_slots) && s.proposed_slots.length > 0 && (
        <div className="rounded-2xl border p-4">
          <div className="mb-2 font-medium">Current proposals</div>
          <ul className="list-disc pl-6 text-sm space-y-1">
            {s.proposed_slots.map((iso, i) => (
              <li key={i}>{new Date(iso).toLocaleString()}</li>
            ))}
          </ul>
        </div>
      )}

      <ProposeForm sessionId={s.id} />
    </div>
  );
}

/* --------- client wrapper with useActionState --------- */
"use client";
import { useActionState } from "react";
function ProposeForm({ sessionId }) {
  const [state, formAction] = useActionState(saveSlotsAction, { error: "", ok: false });
  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border p-4">
      <input type="hidden" name="session_id" value={sessionId} />
      <AuthErrorAlert title="Couldn’t save slots" message={state?.error} />
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="grid gap-1">
          <label htmlFor="slot1" className="text-sm">Slot 1</label>
          <Input id="slot1" name="slot1" type="datetime-local" />
        </div>
        <div className="grid gap-1">
          <label htmlFor="slot2" className="text-sm">Slot 2 (optional)</label>
          <Input id="slot2" name="slot2" type="datetime-local" />
        </div>
        <div className="grid gap-1">
          <label htmlFor="slot3" className="text-sm">Slot 3 (optional)</label>
          <Input id="slot3" name="slot3" type="datetime-local" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit">Save proposals</Button>
        <Button type="reset" variant="outline">Clear</Button>
      </div>
    </form>
  );
}
