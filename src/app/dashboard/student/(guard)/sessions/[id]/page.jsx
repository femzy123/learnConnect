import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Session — LearnConect" };

export default async function StudentSessionPage({ params }) {
  const { id } = await params; // Next 15 style
  const supabase = await createClient();

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load the session you own
  const { data: s } = await supabase
    .from("sessions")
    .select("id, request_id, student_id, teacher_id, price_amount, duration_minutes, payment_status, scheduled_time, created_at")
    .eq("id", id)
    .maybeSingle();

  if (!s) return notFound();
  if (s.student_id !== user.id) redirect("/dashboard/student");

  // Look up teacher name/avatar (optional, nice touch)
  const { data: teacher } = await supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", s.teacher_id)
    .maybeSingle();

  const amountNGN =
    s.price_amount != null
      ? (Number(s.price_amount) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
      : "—";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Session</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/dashboard/student/requests/${s.request_id}`}>← Back to request</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard/student">Student dashboard</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3 text-sm">
          <div className="text-muted-foreground">Session ID</div>
          <div className="font-medium">{s.id}</div>

          <div className="text-muted-foreground pt-2">Teacher</div>
          <div className="font-medium">
            {teacher?.full_name || "—"}
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-muted-foreground">Amount</div>
              <div className="font-semibold">₦{amountNGN}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Duration</div>
              <div className="font-semibold">{s.duration_minutes || "—"} mins</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="text-muted-foreground">Payment status</div>
              <div className="font-semibold capitalize">{s.payment_status || "pending"}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Scheduled time</div>
              <div className="font-semibold">
                {s.scheduled_time ? new Date(s.scheduled_time).toLocaleString() : "Not scheduled yet"}
              </div>
            </div>
          </div>

          {/* Placeholder actions for upcoming Scheduling feature */}
          <div className="pt-4 flex gap-2">
            <Button disabled variant="secondary" title="Coming soon">
              View proposed times
            </Button>
            <Button disabled title="Coming soon">Pick a time</Button>
          </div>

          {s.payment_status !== "paid" && (
            <div className="pt-3 text-xs text-muted-foreground">
              If payment is still pending, go back to the request page to complete payment.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
