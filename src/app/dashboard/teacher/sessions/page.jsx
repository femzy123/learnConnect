import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My Sessions — LearnConect" };

export default async function TeacherSessionsListPage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: sessions = [] } = await supabase
    .from("sessions")
    .select("id, request_id, student_id, payment_status, created_at")
    .eq("teacher_id", user.id)
    .eq("payment_status", "paid")
    .order("created_at", { ascending: false });

  const reqIds = sessions.map((s) => s.request_id).filter(Boolean);
  const { data: reqs = [] } = reqIds.length
    ? await supabase.from("student_requests").select("id, subject_id, topic").in("id", reqIds)
    : { data: [] };

  const subjIds = reqs.map((r) => r.subject_id).filter(Boolean);
  const { data: subjects = [] } = subjIds.length
    ? await supabase.from("subjects").select("id, name").in("id", subjIds)
    : { data: [] };

  const studentIds = sessions.map((s) => s.student_id).filter(Boolean);
  const { data: students = [] } = studentIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", studentIds)
    : { data: [] };

  const reqById = new Map(reqs.map((r) => [r.id, r]));
  const subjById = new Map(subjects.map((s) => [s.id, s.name]));
  const studentNameById = new Map(students.map((t) => [t.id, t.full_name]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Sessions</h1>

      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active sessions yet.</p>
      ) : (
        <ul className="grid gap-3">
          {sessions.map((s) => {
            const r = reqById.get(s.request_id);
            const subject = r?.subject_id ? subjById.get(r.subject_id) : "—";
            const topic = r?.topic || "—";
            const sname = studentNameById.get(s.student_id) || "Student";
            return (
              <li key={s.id} className="rounded-md border p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <div className="font-medium">{subject} · {topic}</div>
                    <div className="text-muted-foreground">Student: {sname}</div>
                  </div>
                  <Button asChild><Link href={`/dashboard/teacher/sessions/${s.id}`}>Open</Link></Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
