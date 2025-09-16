import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My sessions — LearnConect" };

function StatusPill({ scheduled_time, proposed_slots }) {
  const hasChosen = !!scheduled_time;
  const hasProps = Array.isArray(proposed_slots) && proposed_slots.length > 0;
  const txt = hasChosen ? "Scheduled" : hasProps ? "Awaiting student" : "Needs proposals";
  const tone = hasChosen ? "bg-emerald-50 text-emerald-700 border-emerald-200"
    : hasProps ? "bg-amber-50 text-amber-700 border-amber-200"
    : "bg-rose-50 text-rose-700 border-rose-200";
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${tone}`}>{txt}</span>;
}

export default async function TeacherSessionsPage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: rows = [] } = await supabase
    .from("sessions")
    .select("id, rate, proposed_slots, scheduled_time, request:student_requests(id, topic, status, matched_teacher_id)")
    .order("created_at", { ascending: false });

  const mine = rows.filter((s) => s.request?.matched_teacher_id === user.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">My sessions</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/teacher">← Back to dashboard</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">{s.request?.topic || "—"}</td>
                <td className="px-4 py-3"><StatusPill scheduled_time={s.scheduled_time} proposed_slots={s.proposed_slots} /></td>
                <td className="px-4 py-3">₦{(Number(s.rate || 0)/100).toLocaleString()}/hr</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/teacher/sessions/${s.id}`}>View / Propose times</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {!mine.length && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={4}>No sessions yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
