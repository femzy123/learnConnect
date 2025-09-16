import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Admin — Student" };

export default async function AdminStudentDetailPage({ params }) {
  const supabase = await createClient();
  const pr = await params; // await as requested
  const studentId = pr.id;

  async function toggleAccountAction(formData) {
    "use server";
    const supabase = await createClient();
    const uid = String(formData.get("user_id") || "");
    const next = String(formData.get("new_status") || "");
    if (!uid || !["active", "deactivated"].includes(next)) return;
    await supabase
      .from("profiles")
      .update({ account_status: next })
      .eq("id", uid);
    revalidatePath(`/dashboard/admin/students/${uid}`);
  }

  const [
    { data: p },
    { data: reqs = [] },
    { data: cats = [] },
    { data: subs = [] },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, phone, avatar_url, account_status")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("student_requests")
      .select("id, category_id, subject_id, topic, status, created_at")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name"),
    supabase.from("subjects").select("id, name"),
  ]);
  if (!p) return notFound();

  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const subMap = new Map(subs.map((s) => [s.id, s.name]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Student</h1>
        <p className="text-sm text-muted-foreground">
          Profile and request history
        </p>
      </div>

      <div className="flex gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/admin/users?tab=students">
            ← Back to Users
          </Link>
        </Button>
        <form action={toggleAccountAction}>
          <input type="hidden" name="user_id" value={studentId} />
          <input
            type="hidden"
            name="new_status"
            value={p?.account_status === "active" ? "deactivated" : "active"}
          />
          <Button
            type="submit"
            variant={p?.account_status === "active" ? "destructive" : "outline"}
          >
            {p?.account_status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </form>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-sm">
              <div className="text-muted-foreground">Name</div>
              <div className="font-medium">{p.full_name || studentId}</div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Phone</div>
              <div className="font-medium">{p.phone || "—"}</div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Requests</div>
              <div className="font-medium">{reqs.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Topic</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {reqs.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">
                  {new Date(r.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-3">
                  {catMap.get(r.category_id) || "-"}
                </td>
                <td className="px-4 py-3">{subMap.get(r.subject_id) || "-"}</td>
                <td className="px-4 py-3">{r.topic}</td>
                <td className="px-4 py-3 capitalize">{r.status}</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    className="underline"
                    href={`/dashboard/admin/requests/${r.id}`}
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {!reqs.length && (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                  No requests.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
