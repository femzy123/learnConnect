import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import RequestSummary from "./RequestSummary";
import ProposalForm from "./ProposalForm";
import { saveProposalAction } from "./actions";

export const metadata = { title: "Submit proposal — LearnConect" };

export default async function TeacherProposalPage({ params }) {
  const { id: proposalId } = await params; // Next 15 style

  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load proposal + its request (for context)
  const { data: p } = await supabase
    .from("teacher_proposals")
    .select(
      "id, teacher_id, status, fee_amount, duration_minutes, note, request:student_requests(topic, subject_id, category_id)"
    )
    .eq("id", proposalId)
    .maybeSingle();

  if (!p) return notFound();
  if (p.teacher_id !== user.id) redirect("/dashboard/teacher/requests");

  const [{ data: sub }, { data: cat }] = await Promise.all([
    supabase.from("subjects").select("name").eq("id", p.request?.subject_id).maybeSingle(),
    supabase.from("categories").select("name").eq("id", p.request?.category_id).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Submit proposal</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/teacher/requests">← Back to requests</Link>
        </Button>
      </div>

      <RequestSummary
        categoryName={cat?.name}
        subjectName={sub?.name}
        topic={p.request?.topic}
        status={p.status}
      />

      <ProposalForm
        proposalId={p.id}
        initialFee={p.fee_amount != null ? (Number(p.fee_amount) / 100).toString() : ""}
        initialDuration={p.duration_minutes ? String(p.duration_minutes) : ""}
        initialNote={p.note || ""}
        onSave={saveProposalAction}
      />
    </div>
  );
}
