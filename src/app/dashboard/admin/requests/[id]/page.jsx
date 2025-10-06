import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import InviteTeachersPanel from "./InviteTeachersPanel";

import { inviteTeachersAction } from "./actions";

export const metadata = { title: "Admin · Request — LearnConect" };

export default async function AdminRequestDetailPage({ params }) {
  const { id: requestId } = await params; // Next 15 style

  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load the request core data
  const { data: r } = await supabase
    .from("student_requests")
    .select(
      "id, student_id, category_id, subject_id, topic, status, created_at"
    )
    .eq("id", requestId)
    .single();
  if (!r) return notFound();

  const isPaid = r.status === "paid";

  // Basic lookups
  const [{ data: cat }, { data: sub }] = await Promise.all([
    supabase
      .from("categories")
      .select("name")
      .eq("id", r.category_id)
      .maybeSingle(),
    supabase
      .from("subjects")
      .select("name")
      .eq("id", r.subject_id)
      .maybeSingle(),
  ]);

  // Current proposals for this request (list for visibility)
  const { data: proposals = [] } = await supabase
    .from("teacher_proposals")
    .select(
      "id, teacher_id, status, fee_amount, duration_minutes, created_at, updated_at"
    )
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });

  // Load teacher names/avatars for display of current proposals
  const teacherIds = [...new Set(proposals.map((p) => p.teacher_id))];
  const { data: teacherProfiles = [] } = teacherIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", teacherIds)
    : { data: [] };
  const tMap = new Map(teacherProfiles.map((t) => [t.id, t]));

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Request</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/requests">← Back to requests</Link>
        </Button>
      </div>

      {/* Request summary */}
      <Card>
        <CardContent className="p-6 grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Created:</span>{" "}
            <strong>{new Date(r.created_at).toLocaleString()}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Category:</span>{" "}
            <strong>{cat?.name || "—"}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Subject:</span>{" "}
            <strong>{sub?.name || "—"}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Topic:</span>{" "}
            <strong>{r.topic}</strong>
          </div>
          <div>
            <span className="text-muted-foreground">Status:</span>{" "}
            <strong className="capitalize">{r.status}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Invite teachers panel */}
      {!isPaid && (
        <InviteTeachersPanel
          requestId={r.id}
          subjectId={r.subject_id}
          alreadyInvitedIds={teacherIds}
          onInvite={inviteTeachersAction}
        />
      )}

      {/* Current proposals table */}
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Teacher</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Fee</th>
              <th className="px-4 py-3 text-left">Duration</th>
              <th className="px-4 py-3 text-left">Updated</th>
            </tr>
          </thead>
          <tbody>
            {proposals.map((p) => {
              const t = tMap.get(p.teacher_id);
              return (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{t?.full_name || p.teacher_id}</td>
                  <td className="px-4 py-3 capitalize">{p.status}</td>
                  <td className="px-4 py-3">
                    {p.fee_amount != null
                      ? `₦${(Number(p.fee_amount) / 100).toLocaleString()}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {p.duration_minutes ? `${p.duration_minutes} mins` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(p.updated_at || p.created_at).toLocaleString()}
                  </td>
                </tr>
              );
            })}
            {!proposals.length && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={5}>
                  No proposals yet. Invite one or more teachers below.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
