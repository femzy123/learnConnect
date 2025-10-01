import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ChatComposer from "@/components/chat/ChatComposer";

export const metadata = { title: "Session — LearnConect" };

export default async function StudentSessionPage({ params }) {
  const { id } = await params; // Next 15 pattern
  const supabase = await createClient();

  // Auth
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 1) Load the session (must belong to the student)
  const { data: s } = await supabase
    .from("sessions")
    .select("id, student_id, teacher_id, request_id, payment_status")
    .eq("id", id)
    .maybeSingle();

  if (!s) return notFound();
  if (s.student_id !== user.id) redirect("/dashboard/student");

  // Gate: chat after payment only (still gate, just not displayed as text badges)
  const paid = s.payment_status === "paid";
  if (!paid) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Session</h1>
          <Button asChild variant="outline">
            <Link href="/dashboard/student/sessions">← Back to sessions</Link>
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Chat unlocks after payment is confirmed for this session.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2) Resolve details: Subject, Topic, Names
  //    We query request → subject, and both participant names.
  const [{ data: req }, { data: teacher }, { data: student }, { data: me }] =
    await Promise.all([
      supabase
        .from("student_requests")
        .select("id, subject_id, topic")
        .eq("id", s.request_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", s.teacher_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", s.student_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  let subjectName = "—";
  if (req?.subject_id) {
    const { data: subj } = await supabase
      .from("subjects")
      .select("name")
      .eq("id", req.subject_id)
      .maybeSingle();
    subjectName = subj?.name || "—";
  }

  const topic = req?.topic || "—";
  const teacherName = teacher?.full_name || "Teacher";
  const studentName = student?.full_name || "Student";

  // 3) Layout: Details (left, sticky) + Chat (right)
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Session</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/student/sessions">← Back to sessions</Link>
        </Button>
      </div>

      <div className="grid md:grid-cols-12 md:gap-6 gap-4">
        {/* DETAILS: left column, sticky on desktop */}
        <aside className="md:col-span-4">
          <Card className="md:sticky md:top-4">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Subject
                </div>
                <div className="font-medium">{subjectName}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Topic
                </div>
                <div className="font-medium">{topic}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Teacher
                </div>
                <div className="font-medium">{teacherName}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Participant
                </div>
                <div className="font-medium">{studentName}</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* CHAT: right column */}
        <section className="md:col-span-8">
          <Card>
            <CardContent className="p-4 md:p-6 space-y-4">
              {/* Chat header */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10" />
                <div>
                  <div className="font-medium leading-none">{teacherName}</div>
                  <div className="text-xs text-muted-foreground">
                    You’re connected. Be respectful.
                  </div>
                </div>
              </div>

              {/* Chat list */}
              <ChatComposer
                sessionId={s.id}
                currentUserId={user.id}
                meAvatarUrl={me?.avatar_url || student?.avatar_url || ""}
                otherAvatarUrl={teacher?.avatar_url || ""}
                emptyText={`This is the beginning of your chat with your teacher ${teacherName}.`}
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
