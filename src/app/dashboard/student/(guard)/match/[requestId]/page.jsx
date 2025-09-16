import Image from "next/image";
import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// ---------- Server Actions ----------
async function acceptMatchAction(formData) {
  "use server";
  const supabase = await createClient();
  const requestId = String(formData.get("request_id") || "");

  // Only update if the caller is the owner (RLS should enforce this as well)
  await supabase
    .from("student_requests")
    .update({ status: "awaiting_payment" })
    .eq("id", requestId);

  revalidatePath("/dashboard/student");
  redirect("/dashboard/student?accepted=1");
}

async function declineMatchAction(formData) {
  "use server";
  const supabase = await createClient();
  const requestId = String(formData.get("request_id") || "");

  // Return request to the pool; keep session row intact for now (admin can rematch/cleanup)
  await supabase
    .from("student_requests")
    .update({ status: "open", matched_teacher_id: null })
    .eq("id", requestId);

  revalidatePath("/dashboard/student");
  redirect("/dashboard/student?declined=1");
}

// ---------- Page ----------
export const metadata = { title: "Review match — LearnConect" };

export default async function StudentMatchPage({ params }) {
  const { requestId } = await params;
  const supabase = await createClient();

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load request and verify access
  const { data: request } = await supabase
    .from("student_requests")
    .select(
      "id, student_id, category_id, subject_id, topic, status, matched_teacher_id, created_at"
    )
    .eq("id", requestId)
    .single();

  if (!request) return notFound();

  // Load caller profile to check role; owners or admins can view
  const { data: caller } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isOwner = request.student_id === user.id;
  const isAdmin = caller?.role === "admin";
  if (!isOwner && !isAdmin) redirect(`/dashboard/${caller?.role || "student"}`);

  // Must be matched or awaiting_payment to review
  if (request.status !== "matched" && request.status !== "awaiting_payment") {
    redirect("/dashboard/student");
  }

  // Load teacher details (profile + teacher profile)
  const teacherId = request.matched_teacher_id;
  const [{ data: teacherProfile }, { data: tProf }, { data: session }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("full_name, avatar_url, phone")
        .eq("id", teacherId || "")
        .maybeSingle(),
      supabase
        .from("teacher_profiles")
        .select("bio, hourly_rate, vetting_status")
        .eq("user_id", teacherId || "")
        .maybeSingle(),
      supabase
        .from("sessions")
        .select("id, rate")
        .eq("request_id", request.id)
        .maybeSingle(),
    ]);

  // Determine the locked hourly rate (prefer session.rate)
  const rateMinor = session?.rate ?? tProf?.hourly_rate ?? 0;
  const rateDisplay = formatNGN(rateMinor);

  const name = teacherProfile?.full_name || "Teacher";
  const avatar = teacherProfile?.avatar_url || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Review your match</h1>
        <p className="text-sm text-muted-foreground">
          We found a teacher for “{request.topic}”. Review the details and continue.
        </p>
      </header>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 sm:grid-cols-[160px_1fr]">
            {/* Teacher card */}
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatar} alt={name} />
                <AvatarFallback>
                  {name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-medium">{name}</div>
                <div className="text-xs text-muted-foreground">
                  Vetted • {tProf?.vetting_status || "pending"}
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="text-sm">
                <div className="text-muted-foreground">Topic</div>
                <div className="font-medium">{request.topic}</div>
              </div>

              <div className="text-sm">
                <div className="text-muted-foreground">Hourly rate</div>
                <div className="font-medium">{rateDisplay}</div>
                <div className="text-xs text-muted-foreground">
                  Rate is locked for this session.
                </div>
              </div>

              <div className="text-sm">
                <div className="text-muted-foreground">About the teacher</div>
                <div>{tProf?.bio || "No bio provided yet."}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Accept */}
        <form action={acceptMatchAction}>
          <input type="hidden" name="request_id" value={request.id} />
          <Button type="submit" className="w-full sm:w-auto">
            Accept & Continue to Payment
          </Button>
        </form>

        {/* Decline */}
        <form action={declineMatchAction}>
          <input type="hidden" name="request_id" value={request.id} />
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            Decline & Rematch
          </Button>
        </form>
      </div>

      {/* Note about next step */}
      {request.status === "awaiting_payment" && (
        <p className="text-sm text-muted-foreground">
          You’ve accepted this match. We’ll take you to payment shortly.
        </p>
      )}
    </div>
  );
}

// ---- helpers ----
function formatNGN(minor) {
  const major = Number(minor || 0) / 100;
  return `₦${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}/hr`;
}