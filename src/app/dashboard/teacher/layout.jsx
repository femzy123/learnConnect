import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function TeacherLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (!profile?.role) redirect("/auth/select-role");
  if (profile.role !== "teacher" && profile.role !== "admin") {
    return redirect(`/dashboard/${profile.role}`);
  }

  return (
    <DashboardShell role="teacher" profile={profile} user={user}>
      {children}
    </DashboardShell>
  );
}
