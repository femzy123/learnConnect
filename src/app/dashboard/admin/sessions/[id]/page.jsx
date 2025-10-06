// app/admin/sessions/[id]/page.jsx
import React from "react";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import AdminMessageList from "./MessageList.jsx";

async function assertAdmin(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: adminRow }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("admins").select("id").eq("id", user.id).maybeSingle(),
  ]);

  const isAdmin = profile?.role === "admin" || !!adminRow;
  if (!isAdmin) redirect("/dashboard");
  return user;
}

export default async function AdminSessionDetail({ params, searchParams }) {
  await searchParams; // avoid sync access if you later read it
  const supabase = await createClient();
  await assertAdmin(supabase);

  const sessionId = params.id;

  const { data: session } = await supabase
    .from("sessions")
    .select(
      "id, request_id, student_id, teacher_id, price_amount, duration_minutes, created_at"
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) notFound();

  const [{ data: req }, { data: student }, { data: teacher }] =
    await Promise.all([
      supabase
        .from("student_requests")
        .select("subject_id, topic")
        .eq("id", session.request_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", session.student_id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .eq("id", session.teacher_id)
        .maybeSingle(),
    ]);

  let subjectName = "—";
  let categoryName = "—";
  if (req?.subject_id) {
    const { data: subj } = await supabase
      .from("subjects")
      .select("id, name, category_id")
      .eq("id", req.subject_id)
      .maybeSingle();
    subjectName = subj?.name ?? "—";
    if (subj?.category_id) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id, name")
        .eq("id", subj.category_id)
        .maybeSingle();
      categoryName = cat?.name ?? "—";
    }
  }

  return (
    <div className="space-y-4">
      <div className="mb-4 rounded-lg border p-4 grid grid-cols-1 md:grid-cols-2 gap-2">
        <div>
          <span className="text-xs text-muted-foreground">Subject</span>
          <div className="font-medium">{subjectName}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Category</span>
          <div className="font-medium">{categoryName}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Topic</span>
          <div className="font-medium">{req?.topic ?? "—"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Student</span>
          <div className="font-medium">{student?.full_name ?? "—"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Teacher</span>
          <div className="font-medium">{teacher?.full_name ?? "—"}</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Fee</span>
          <div className="font-medium">
            ₦{(session.price_amount / 100).toLocaleString()}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Duration</span>
          <div className="font-medium">{session.duration_minutes} min</div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Created</span>
          <div className="font-medium">
            {new Date(session.created_at).toLocaleString()}
          </div>
        </div>
        <div>
          <span className="text-xs text-muted-foreground">Mode</span>
          <div className="font-medium">Read-only (admin)</div>
        </div>
      </div>

      <div className="h-[70vh] border rounded-lg">
        <AdminMessageList
          sessionId={sessionId}
          participants={{
            [session.student_id]: {
              name: student?.full_name ?? "Student",
              role: "Student",
            },
            [session.teacher_id]: {
              name: teacher?.full_name ?? "Teacher",
              role: "Teacher",
            },
          }}
        />
      </div>
    </div>
  );
}
