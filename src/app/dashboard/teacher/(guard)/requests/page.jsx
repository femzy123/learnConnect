import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Teacher — Requests to propose" };

export default async function TeacherRequestsToProposePage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // invitations + drafts you (the teacher) can act on
  const { data: proposals = [] } = await supabase
    .from("teacher_proposals")
    .select("id, request_id, status, fee_amount, duration_minutes, updated_at, request:student_requests(topic, subject_id)")
    .eq("teacher_id", user.id)
    .in("status", ["invited", "submitted"])
    .order("updated_at", { ascending: false });

  const subjectIds = [...new Set(proposals.map(p => p.request?.subject_id).filter(Boolean))];
  const { data: subjects = [] } = subjectIds.length
    ? await supabase.from("subjects").select("id, name").in("id", subjectIds)
    : { data: [] };
  const sMap = new Map(subjects.map(s => [s.id, s.name]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Requests to propose</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/teacher">← Back to dashboard</Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Your status</th>
              <th className="px-4 py-3">Your proposal</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{sMap.get(p.request?.subject_id) || "—"}</td>
                <td className="px-4 py-3">{p.request?.topic || "—"}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
                <td className="px-4 py-3">
                  {p.fee_amount != null ? `₦${(Number(p.fee_amount) / 100).toLocaleString()}` : "—"}{" "}
                  {p.duration_minutes ? `· ${p.duration_minutes} mins` : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/teacher/requests/${p.id}`}>View / Submit</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {!proposals.length && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  You don’t have any invitations right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
