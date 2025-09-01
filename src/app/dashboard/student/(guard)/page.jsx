import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Student dashboard — LearnConect" };

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();

  const [{ data: categories = [] }, { data: subjects = [] }, { data: requests = [] }] =
    await Promise.all([
      supabase.from("categories").select("id,name"),
      supabase.from("subjects").select("id,name"),
      supabase
        .from("student_requests")
        .select("id,category_id,subject_id,topic,status,created_at")
        .eq("student_id", user?.id || "")
        .order("created_at", { ascending: false }),
    ]);

  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const subjMap = new Map(subjects.map((s) => [s.id, s.name]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Your requests</h1>
        <Button asChild>
          <Link href="/dashboard/student/request">New request</Link>
        </Button>
      </div>

      {requests?.length ? (
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{catMap.get(r.category_id) || "-"}</td>
                  <td className="px-4 py-3">{subjMap.get(r.subject_id) || "-"}</td>
                  <td className="px-4 py-3">{r.topic}</td>
                  <td className="px-4 py-3 capitalize">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border p-6 text-sm">
          <p className="text-muted-foreground">
            You haven’t created any requests yet.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard/student/request">Create your first request</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
