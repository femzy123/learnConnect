import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Admin — Teachers" };

function StatusPill({ status }) {
  const s = (status || "pending").toLowerCase();
  const styles =
    s === "approved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "rejected"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs ${styles}`}>
      {s}
    </span>
  );
}

function formatNGN(minor) {
  if (minor == null) return "—";
  const major = Number(minor) / 100;
  return `₦${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}/hr`;
}

export default async function AdminTeachersPage() {
  const supabase = await createClient();

  const { data: teachers = [] } = await supabase
    .from("teacher_profiles")
    .select("user_id, vetting_status, hourly_rate, profiles:profiles(full_name, avatar_url, phone)")
    .order("vetting_status", { ascending: true });

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Teachers</h1>
      </div>

      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.user_id} className="border-t">
                <td className="px-4 py-3">{t.profiles?.full_name || t.user_id}</td>
                <td className="px-4 py-3">{t.profiles?.phone || "—"}</td>
                <td className="px-4 py-3"><StatusPill status={t.vetting_status} /></td>
                <td className="px-4 py-3">{formatNGN(t.hourly_rate)}</td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" asChild>
                    <Link href={`/dashboard/admin/teachers/${t.user_id}`}>Review</Link>
                  </Button>
                </td>
              </tr>
            ))}
            {!teachers.length && (
              <tr><td className="px-4 py-6 text-muted-foreground" colSpan={5}>No teachers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
