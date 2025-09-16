import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function TeacherGuardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: profile }, { data: tprof }, { data: ts = [] }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, role, full_name, phone, avatar_url, account_status")
        .eq("id", user.id)
        .single(),
      supabase
        .from("teacher_profiles")
        .select("bio, hourly_rate")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("teacher_subjects")
        .select("subject_id")
        .eq("teacher_user_id", user.id),
    ]);

  if (profile?.account_status === "deactivated") {
    redirect("/auth/deactivated");
  }

  // Only teacher or admin can be here
  if (profile?.role !== "teacher" && profile?.role !== "admin") {
    redirect(`/dashboard/${profile?.role || "student"}`);
  }

  const coreIncomplete =
    !profile?.full_name || !profile?.phone || !profile?.avatar_url;
  const teachIncomplete =
    !tprof?.bio || !tprof?.hourly_rate || (ts?.length ?? 0) === 0;

  if (coreIncomplete || teachIncomplete) {
    redirect("/dashboard/teacher/profile?incomplete=1");
  }

  return <>{children}</>;
}
