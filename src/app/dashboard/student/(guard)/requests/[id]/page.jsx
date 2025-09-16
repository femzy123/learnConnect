import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/* -------- server actions (rely on RLS + id scoping) -------- */
async function acceptMatchAction(formData) {
  "use server";
  const requestId = String(formData.get("request_id") || "");
  if (!requestId) return;
  const supabase = await createClient();
  await supabase
    .from("student_requests")
    .update({ status: "awaiting_payment" })
    .eq("id", requestId);
  revalidatePath(`/dashboard/student/request/${requestId}`);
  revalidatePath("/dashboard/student");
}

async function declineMatchAction(formData) {
  "use server";
  const requestId = String(formData.get("request_id") || "");
  if (!requestId) return;
  const supabase = await createClient();
  await supabase
    .from("student_requests")
    .update({ status: "open", matched_teacher_id: null })
    .eq("id", requestId);
  revalidatePath(`/dashboard/student/request/${requestId}`);
  revalidatePath("/dashboard/student");
}

/* ---------------- page ---------------- */
export const metadata = { title: "Request — LearnConect" };

export default async function StudentRequestDetailPage({ params }) {
  const pr = await params; // Next 15 pattern
  const requestId = pr.id;
  if (!requestId) return notFound();

  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load request
  const { data: r } = await supabase
    .from("student_requests")
    .select("id, student_id, category_id, subject_id, topic, status, matched_teacher_id, created_at")
    .eq("id", requestId)
    .single();

  if (!r) return notFound();
  if (r.student_id !== user.id) redirect("/dashboard/student");

  // Lookups
  const [{ data: cat }, { data: sub }] = await Promise.all([
    supabase.from("categories").select("name").eq("id", r.category_id).maybeSingle(),
    supabase.from("subjects").select("name").eq("id", r.subject_id).maybeSingle(),
  ]);

  // Teacher + session (if matched)
  const [{ data: teacher }, { data: tProf }, { data: s }] = await Promise.all([
    r.matched_teacher_id
      ? supabase.from("profiles").select("full_name, phone, avatar_url").eq("id", r.matched_teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
    r.matched_teacher_id
      ? supabase.from("teacher_profiles").select("bio, hourly_rate, vetting_status").eq("user_id", r.matched_teacher_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("sessions").select("id, rate, proposed_slots, scheduled_time").eq("request_id", r.id).maybeSingle(),
  ]);

  const hourlyMinor = s?.rate ?? tProf?.hourly_rate ?? null;
  const amountStr = hourlyMinor != null ? `₦${(Number(hourlyMinor) / 100).toLocaleString()}` : null;

  const teacherName = teacher?.full_name || "—";
  const teacherAvatar = teacher?.avatar_url || "";
  const vetting = tProf?.vetting_status || "pending";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Request</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/student">← Back to dashboard</Link>
        </Button>
      </div>

      {/* side-by-side cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Request details */}
        <Card>
          <CardContent className="p-6 space-y-3 text-sm">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Request</div>
            <div>
              <div className="text-muted-foreground">Created</div>
              <div className="font-medium">{new Date(r.created_at).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Category</div>
              <div className="font-medium">{cat?.name || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Subject</div>
              <div className="font-medium">{sub?.name || "—"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Topic</div>
              <div className="font-medium">{r.topic}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Status</div>
              <div className="font-medium capitalize">{r.status}</div>
            </div>
          </CardContent>
        </Card>

        {/* Matched teacher */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Matched teacher</div>

            {r.matched_teacher_id ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={teacherAvatar} alt={teacherName} />
                    <AvatarFallback>
                      {teacherName.split(" ").map((p) => p[0]).join("").slice(0,2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{teacherName}</div>
                    <div className="text-xs text-muted-foreground">Vetting: {vetting}</div>
                  </div>
                </div>

                <div className="text-sm space-y-2">
                  <div>
                    <div className="text-muted-foreground">Hourly rate</div>
                    <div className="font-medium">{amountStr || "—"}</div>
                    <div className="text-xs text-muted-foreground">Rate locked for this session.</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Bio</div>
                    <div>{tProf?.bio || "No bio yet."}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">No teacher matched yet.</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions (contextual) */}
      <div className="flex flex-wrap gap-2">
        {/* If matched: Accept / Decline */}
        {r.status === "matched" && (
          <>
            <form action={acceptMatchAction}>
              <input type="hidden" name="request_id" value={r.id} />
              <Button type="submit">Accept & Continue to Payment</Button>
            </form>
            <form action={declineMatchAction}>
              <input type="hidden" name="request_id" value={r.id} />
              <Button type="submit" variant="outline">Decline & Rematch</Button>
            </form>
          </>
        )}

        {/* If ready to pay */}
        {r.status === "awaiting_payment" && (
          <Button asChild>
            <Link href={`/dashboard/student/pay/${r.id}`}>Pay with Paystack</Link>
          </Button>
        )}

        {/* If scheduled/paid: quick hint (read-only) */}
        {(r.status === "paid" || r.status === "scheduled") && s && s.scheduled_time && (
          <div className="text-sm text-muted-foreground self-center">
            Scheduled: <strong>{new Date(s.scheduled_time).toLocaleString()}</strong>
          </div>
        )}
      </div>
    </div>
  );
}
