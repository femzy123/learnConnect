// app/admin/sessions/page.jsx
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server"; // <-- fixed path

function readParam(params, key, fallback = undefined) {
  if (!params) return fallback;
  if (typeof params.get === "function") return params.get(key) ?? fallback; // URLSearchParams
  return params[key] ?? fallback; // plain object
}

function getPaginationFromParams(params) {
  const pageSize = 20;
  const pageParam = Number(readParam(params, "page", 1));
  const page = Math.max(1, pageParam);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { page, pageSize, from, to };
}

async function assertAdmin(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [{ data: profile }, { data: adminRow }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    supabase.from("admins").select("id").eq("id", user.id).maybeSingle(),
  ]);

  const isAdmin = profile?.role === "admin" || !!adminRow;
  if (!isAdmin) redirect("/dashboard");
  return user;
}

async function fetchSessionsIndex(supabase, { from, to, q }) {
  const { data: sessions = [] } = await supabase
    .from("sessions")
    .select("id, request_id, student_id, teacher_id, price_amount, duration_minutes, created_at")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (!sessions.length) return { meta: [] };

  const studentIds = [...new Set(sessions.map((s) => s.student_id))];
  const teacherIds = [...new Set(sessions.map((s) => s.teacher_id))];
  const requestIds = [...new Set(sessions.map((s) => s.request_id))];
  const sessionIds = sessions.map((s) => s.id);

  const [
    { data: students = [] },
    { data: teachers = [] },
    { data: requests = [] },
    { data: subjects = [] },
    { data: categories = [] },
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name").in("id", studentIds),
    supabase.from("profiles").select("id, full_name").in("id", teacherIds),
    supabase.from("student_requests").select("id, subject_id, topic").in("id", requestIds),
    supabase.from("subjects").select("id, category_id, name"),
    supabase.from("categories").select("id, name"),
  ]);

  // Last message per session (simple fallback)
  const { data: msgs = [] } = await supabase
    .from("messages")
    .select("session_id, created_at")
    .in("session_id", sessionIds)
    .order("created_at", { ascending: false });

  const lastBySession = new Map();
  for (const m of msgs) if (!lastBySession.has(m.session_id)) lastBySession.set(m.session_id, m.created_at);

  const toNameMap = (rows) => Object.fromEntries(rows.map((r) => [r.id, r.full_name]));
  const subjectById = Object.fromEntries(subjects.map((s) => [s.id, s]));
  const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));
  const requestById  = Object.fromEntries(requests.map((r) => [r.id, r]));
  const studentName  = toNameMap(students);
  const teacherName  = toNameMap(teachers);

  const meta = sessions.map((s) => {
    const req = requestById[s.request_id];
    const subj = req ? subjectById[req.subject_id] : null;
    const cat  = subj ? categoryById[subj.category_id] : null;
    return {
      id: s.id,
      studentName: studentName[s.student_id] ?? "—",
      teacherName: teacherName[s.teacher_id] ?? "—",
      subject: subj?.name ?? "—",
      category: cat?.name ?? "—",
      topic: req?.topic ?? "—",
      priceAmount: s.price_amount,
      duration: s.duration_minutes,
      createdAt: s.created_at,
      lastMessageAt: lastBySession.get(s.id) ?? null,
    };
  });

  const qnorm = (q ?? "").trim().toLowerCase();
  const filtered = qnorm
    ? meta.filter((r) =>
        [r.studentName, r.teacherName, r.subject, r.category, r.topic]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(qnorm))
      )
    : meta;

  return { meta: filtered };
}

export default async function AdminSessionsIndex({ searchParams }) {
  const params = await searchParams;                 // <-- await the promise
  const supabase = await createClient();

  await assertAdmin(supabase);

  const { page, pageSize, from, to } = getPaginationFromParams(params);
  const q = readParam(params, "q", "");

  const { meta } = await fetchSessionsIndex(supabase, { from, to, q });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <form className="w-full max-w-md">
          <input
            className="w-full rounded-md border px-3 py-2"
            name="q"
            defaultValue={q}
            placeholder="Search by student, teacher, subject, topic…"
          />
        </form>
      </div>

      <div className="overflow-x-auto border rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3">Subject</th>
              <th className="text-left p-3">Category</th>
              <th className="text-left p-3">Topic</th>
              <th className="text-left p-3">Student</th>
              <th className="text-left p-3">Teacher</th>
              <th className="text-left p-3">Fee</th>
              <th className="text-left p-3">Duration</th>
              <th className="text-left p-3">Created</th>
              <th className="text-left p-3">Last Msg</th>
              <th className="text-left p-3">Open</th>
            </tr>
          </thead>
          <tbody>
            {meta.length === 0 ? (
              <tr>
                <td colSpan={10} className="p-6 text-center text-muted-foreground">
                  No sessions found.
                </td>
              </tr>
            ) : (
              meta.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-3">{r.subject}</td>
                  <td className="p-3">{r.category}</td>
                  <td className="p-3">{r.topic}</td>
                  <td className="p-3">{r.studentName}</td>
                  <td className="p-3">{r.teacherName}</td>
                  <td className="p-3">₦{(r.priceAmount / 100).toLocaleString()}</td>
                  <td className="p-3">{r.duration} min</td>
                  <td className="p-3">{new Date(r.createdAt).toLocaleString()}</td>
                  <td className="p-3">{r.lastMessageAt ? new Date(r.lastMessageAt).toLocaleString() : "—"}</td>
                  <td className="p-3">
                    <Link className="underline" href={`/dashboard/admin/sessions/${r.id}`}>
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-2">
        {page > 1 && (
          <Link className="underline" href={`/dashboard/admin/sessions?page=${page - 1}&q=${encodeURIComponent(q)}`}>
            Prev
          </Link>
        )}
        <span className="text-xs text-muted-foreground">Page {page}</span>
        {meta.length === pageSize && (
          <Link className="underline" href={`/dashboard/admin/sessions?page=${page + 1}&q=${encodeURIComponent(q)}`}>
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
