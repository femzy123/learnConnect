import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

/* ---------------- server action: accept proposal ---------------- */
async function acceptProposalAction(formData) {
  "use server";
  const supabase = await createClient();

  const requestId = String(formData.get("request_id") || "");
  const proposalId = String(formData.get("proposal_id") || "");
  if (!requestId || !proposalId) return;

  // Auth
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load request + proposal, basic ownership checks
  const [{ data: req }, { data: prop }] = await Promise.all([
    supabase.from("student_requests")
      .select("id, student_id, status")
      .eq("id", requestId)
      .single(),
    supabase.from("teacher_proposals")
      .select("id, request_id, teacher_id, fee_amount, duration_minutes, status")
      .eq("id", proposalId)
      .single(),
  ]);

  if (!req || !prop || prop.request_id !== req.id) return;
  if (req.student_id !== user.id) redirect("/dashboard/student");

  // If already awaiting payment, reuse existing session
  if (req.status === "awaiting_payment") {
    const { data: existing } = await supabase
      .from("sessions")
      .select("id")
      .eq("request_id", req.id)
      .maybeSingle();
    if (existing?.id) redirect(`/dashboard/student/pay/${existing.id}`);
  }

  // Mark chosen proposal accepted; others rejected
  await supabase
    .from("teacher_proposals")
    .update({ status: "rejected" })
    .eq("request_id", req.id)
    .neq("id", prop.id);

  await supabase
    .from("teacher_proposals")
    .update({ status: "accepted" })
    .eq("id", prop.id);

  // Create or upsert a session for this request
  // (Price & duration locked from the chosen proposal)
  const { data: session } = await supabase
    .from("sessions")
    .upsert({
      request_id: req.id,
      student_id: req.student_id,
      teacher_id: prop.teacher_id,
      price_amount: prop.fee_amount,        // kobo
      duration_minutes: prop.duration_minutes,
      payment_status: "pending",
    }, { onConflict: "request_id" })        // one session per request
    .select("id")
    .single();

  // Update request to awaiting_payment
  await supabase
    .from("student_requests")
    .update({ status: "awaiting_payment" })
    .eq("id", req.id);

  revalidatePath(`/dashboard/student/requests/${req.id}`);
  revalidatePath("/dashboard/student/requests");
  redirect(`/dashboard/student/pay/${session.id}`);
}

async function continueToPaymentAction(formData) {
  "use server";
  const { createClient } = await import("@/utils/supabase/server");
  const { redirect } = await import("next/navigation");

  const supabase = await createClient();
  const requestId = String(formData.get("request_id") || "");
  if (!requestId) return;

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Ensure the request belongs to the student and is awaiting payment
  const { data: req } = await supabase
    .from("student_requests")
    .select("id, student_id, status")
    .eq("id", requestId)
    .single();

  if (!req || req.student_id !== user.id) redirect("/dashboard/student");

  // Reuse session if it exists
  const { data: existing } = await supabase
    .from("sessions")
    .select("id")
    .eq("request_id", req.id)
    .maybeSingle();

  let sessionId = existing?.id;

  // Otherwise build session from accepted proposal
  if (!sessionId) {
    const { data: accepted } = await supabase
      .from("teacher_proposals")
      .select("teacher_id, fee_amount, duration_minutes")
      .eq("request_id", req.id)
      .eq("status", "accepted")
      .maybeSingle();

    if (!accepted) {
      // No accepted proposal found—nothing to pay for yet
      return { error: "No accepted proposal found for this request." };
    }

    const { data: s } = await supabase
      .from("sessions")
      .upsert({
        request_id: req.id,
        student_id: req.student_id,
        teacher_id: accepted.teacher_id,
        price_amount: accepted.fee_amount,     // kobo
        duration_minutes: accepted.duration_minutes,
        payment_status: "pending",
      }, { onConflict: "request_id" })
      .select("id")
      .single();

    sessionId = s?.id;

    // Ensure request status is awaiting_payment
    await supabase
      .from("student_requests")
      .update({ status: "awaiting_payment" })
      .eq("id", req.id);
  }

  redirect(`/dashboard/student/pay/${sessionId}`);
}

/* ---------------- page ---------------- */
export const metadata = { title: "Request — LearnConect" };

export default async function StudentRequestDetailPage({ params }) {
  const { id: requestId } = await params; // Next 15 pattern
  if (!requestId) return notFound();

  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load request
  const { data: r } = await supabase
    .from("student_requests")
    .select("id, student_id, category_id, subject_id, topic, status, created_at")
    .eq("id", requestId)
    .single();

  if (!r) return notFound();
  if (r.student_id !== user.id) redirect("/dashboard/student");

  // Lookups
  const [{ data: cat }, { data: sub }] = await Promise.all([
    supabase.from("categories").select("name").eq("id", r.category_id).maybeSingle(),
    supabase.from("subjects").select("name").eq("id", r.subject_id).maybeSingle(),
  ]);

  // Proposals (submitted only)
  const { data: proposals = [] } = await supabase
    .from("teacher_proposals")
    .select("id, teacher_id, fee_amount, duration_minutes, note, status")
    .eq("request_id", r.id)
    .eq("status", "submitted")
    .order("id", { ascending: true });

  // Profiles for each teacher
  const teacherIds = [...new Set(proposals.map(p => p.teacher_id))];
  const { data: profs = [] } = teacherIds.length
    ? await supabase.from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", teacherIds)
    : { data: [] };
  const pMap = new Map(profs.map(p => [p.id, p]));

  // If awaiting_payment, load session to show "Continue" CTA
  let session = null;
  if (r.status === "awaiting_payment") {
    const { data: s } = await supabase
      .from("sessions")
      .select("id, price_amount, scheduled_time")
      .eq("request_id", r.id)
      .maybeSingle();
    session = s || null;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Request</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/student/requests">← Back to requests</Link>
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

        {/* Proposals list */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Teacher proposals</div>

            {proposals.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                No submitted proposals yet. You’ll see them here once teachers respond.
              </div>
            ) : (
              <ul className="space-y-3">
                {proposals.map((p) => {
                  const prof = pMap.get(p.teacher_id);
                  const teacherName = prof?.full_name || "Unnamed";
                  const teacherAvatar = prof?.avatar_url || "";
                  const amountStr =
                    p.fee_amount != null ? `₦${(Number(p.fee_amount) / 100).toLocaleString()}` : "—";
                  return (
                    <li key={p.id} className="rounded-lg border p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={teacherAvatar} alt={teacherName} />
                          <AvatarFallback>
                            {teacherName.split(" ").map((x) => x[0]).join("").slice(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="font-medium truncate">{teacherName}</div>
                          <div className="text-xs text-muted-foreground">
                            Offer: <strong>{amountStr}</strong> · {p.duration_minutes || "—"} mins
                          </div>
                        </div>
                      </div>

                      {p.note && (
                        <div className="mt-2 text-sm">
                          <div className="text-muted-foreground">Note</div>
                          <div>{p.note}</div>
                        </div>
                      )}

                      <div className="mt-3">
                        <form action={acceptProposalAction}>
                          <input type="hidden" name="request_id" value={r.id} />
                          <input type="hidden" name="proposal_id" value={p.id} />
                          <Button type="submit" size="sm">Accept & Continue to Payment</Button>
                        </form>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* If ready to pay already */}
      {r.status === "awaiting_payment" && (
        <form action={continueToPaymentAction} className="flex gap-2">
          <input type="hidden" name="request_id" value={r.id} />
          <Button type="submit">Continue to Payment</Button>
        </form>
      )}
    </div>
  );
}
