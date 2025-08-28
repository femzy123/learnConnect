import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin — Requests" };

export default async function AdminRequestsPage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();

  // Basic guard: if not authed, the middleware should already redirect; we keep going.
  const { data: requests = [] } = await supabase
    .from("student_requests")
    .select("id, student_id, category_id, subject_id, topic, status, created_at")
    .order("created_at", { ascending: false });

  const [{ data: cats = [] }, { data: subs = [] }, { data: students = [] }] = await Promise.all([
    supabase.from("categories").select("id,name"),
    supabase.from("subjects").select("id,name"),
    supabase.from("profiles").select("id,full_name"),
  ]);

  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const subMap = new Map(subs.map((s) => [s.id, s.name]));
  const userMap = new Map(students.map((s) => [s.id, s.full_name || "Unknown"]));

  const groups = {
    open: requests.filter((r) => r.status === "open"),
    matched: requests.filter((r) => r.status === "matched"),
    paid: requests.filter((r) => r.status === "paid"),
    completed: requests.filter((r) => r.status === "completed"),
    cancelled: requests.filter((r) => r.status === "cancelled"),
  };

  function Section({ title, items }) {
    return (
      <section className="mb-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          {/* Room for future filters */}
        </div>

        {items.length ? (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Topic</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">{userMap.get(r.student_id) || "-"}</td>
                    <td className="px-4 py-3">{catMap.get(r.category_id) || "-"}</td>
                    <td className="px-4 py-3">{subMap.get(r.subject_id) || "-"}</td>
                    <td className="px-4 py-3">{r.topic}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" asChild>
                        <Link href={`/dashboard/admin/requests/${r.id}`}>Review</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border p-6 text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        )}
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Requests</h1>
      </div>

      <Section title="Open" items={groups.open} />
      <Section title="Matched" items={groups.matched} />
      <Section title="Paid" items={groups.paid} />
      <Section title="Completed" items={groups.completed} />
      <Section title="Cancelled" items={groups.cancelled} />
    </div>
  );
}
