import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "My Sessions — LearnConect" };

export default async function StudentSessionsListPage() {
  const supabase = await createClient();

  // 1) Auth (server-side)
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // 2) Fetch this student’s sessions (newest first)
  const { data: rows = [] } = await supabase
    .from("sessions")
    .select("id, teacher_id, price_amount, payment_status, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false });

  // 3) Only active sessions should allow chat access
  const active = rows.filter((s) => s.payment_status === "paid");

  // 4) (Nice-to-have) Resolve teacher names in one query
  const teacherIds = [...new Set(active.map((s) => s.teacher_id))];
  const { data: teachers = [] } = teacherIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", teacherIds)
    : { data: [] };
  const nameById = new Map(teachers.map((t) => [t.id, t.full_name]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Sessions</h1>

      {active.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active sessions yet. Complete payment on a request to unlock chat.
        </p>
      ) : (
        <ul className="grid gap-3">
          {active.map((s) => {
            const ngn =
              s.price_amount != null
                ? (Number(s.price_amount) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
                : "—";
            const tname = nameById.get(s.teacher_id) || "Teacher";
            return (
              <li key={s.id} className="rounded-md border p-3 flex items-center justify-between">
                <div className="text-sm">
                  <div className="font-medium">{tname}</div>
                  <div className="text-muted-foreground">
                    ₦{ngn} · Session {s.id.slice(0, 8)}
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/dashboard/student/sessions/${s.id}`}>Open</Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
