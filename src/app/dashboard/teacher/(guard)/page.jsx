import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Teacher dashboard — LearnConect" };

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();

  const [{ data: profile }, { data: tprof }, { data: ts = [] }, { data: subjects = [] }] =
    await Promise.all([
      supabase.from("profiles").select("full_name, role").eq("id", user?.id || "").single(),
      supabase.from("teacher_profiles").select("vetting_status, bio").eq("user_id", user?.id || "").maybeSingle(),
      supabase.from("teacher_subjects").select("subject_id").eq("teacher_user_id", user?.id || ""),
      supabase.from("subjects").select("id,name").order("name", { ascending: true }),
    ]);

  const subjMap = new Map(subjects.map(s => [s.id, s.name]));
  const selectedNames = ts.map(t => subjMap.get(t.subject_id)).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}</h1>
          <p className="text-sm text-muted-foreground">
            Vetting status: <strong className="capitalize">{tprof?.vetting_status || "not started"}</strong>
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/teacher/profile">{tprof ? "Edit profile" : "Finish onboarding"}</Link>
        </Button>
      </div>

      <div className="rounded-2xl border p-4">
        <h2 className="mb-2 text-lg font-semibold">Profile summary</h2>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-muted-foreground">Subjects</dt><dd>{selectedNames.length ? selectedNames.join(", ") : "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-muted-foreground">Bio</dt><dd>{tprof?.bio || "—"}</dd></div>
        </dl>
      </div>
    </div>
  );
}

function formatNGN(minor) {
  if (minor == null) return "—";
  const major = Number(minor) / 100;
  return `₦${major.toLocaleString(undefined, { maximumFractionDigits: 2 })}/hr`;
}
