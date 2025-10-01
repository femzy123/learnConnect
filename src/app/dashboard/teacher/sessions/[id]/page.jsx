import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ChatComposer from "@/components/chat/ChatComposer";

export const metadata = { title: "Session — LearnConect" };

export default async function TeacherSessionPage({ params }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: s } = await supabase
    .from("sessions")
    .select("id, teacher_id, student_id, request_id, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (!s) return notFound();
  if (s.teacher_id !== user.id) redirect("/dashboard/teacher");
  if (s.payment_status !== "paid") {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Session</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard/teacher/sessions">← Back to sessions</Link>
          </Button>
        </div>
        <Card><CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Chat unlocks after payment is confirmed.</p>
        </CardContent></Card>
      </div>
    );
  }

  const [{ data: req }, { data: student }, { data: teacher }, { data: me }] = await Promise.all([
    supabase.from("student_requests").select("id, subject_id, topic").eq("id", s.request_id).maybeSingle(),
    supabase.from("profiles").select("full_name, avatar_url").eq("id", s.student_id).maybeSingle(),
    supabase.from("profiles").select("full_name, avatar_url").eq("id", s.teacher_id).maybeSingle(),
    supabase.from("profiles").select("avatar_url").eq("id", user.id).maybeSingle(),
  ]);

  let subjectName = "—";
  if (req?.subject_id) {
    const { data: subj } = await supabase.from("subjects").select("name").eq("id", req.subject_id).maybeSingle();
    subjectName = subj?.name || "—";
  }

  const topic = req?.topic || "—";
  const studentName = student?.full_name || "Student";
  const teacherName = teacher?.full_name || "Teacher";

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Session</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/teacher/sessions">← Back to sessions</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-12 md:gap-6 gap-4">
        <aside className="md:col-span-4">
          <Card className="md:sticky md:top-4">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Subject</div>
                <div className="font-medium">{subjectName}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Topic</div>
                <div className="font-medium">{topic}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Teacher</div>
                <div className="font-medium">{teacherName}</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Participant</div>
                <div className="font-medium">{studentName}</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        <section className="md:col-span-8">
          <Card>
            <CardContent className="p-4 md:p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10" />
                <div>
                  <div className="font-medium leading-none">{studentName}</div>
                  <div className="text-xs text-muted-foreground">You’re connected. Be respectful.</div>
                </div>
              </div>

              <ChatComposer
                sessionId={s.id}
                currentUserId={user.id}
                meAvatarUrl={me?.avatar_url || teacher?.avatar_url || ""}
                otherAvatarUrl={student?.avatar_url || ""}
                emptyText={`This is the beginning of your chat with your student ${studentName}.`}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
