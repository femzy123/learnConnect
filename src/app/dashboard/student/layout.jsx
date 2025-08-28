import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function StudentLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  // No role yet? send them to choose.
  if (!profile?.role) redirect("/auth/select-role");

  // Only 'student' or 'admin' can view; others get redirected to their dashboard.
  if (profile.role !== "student" && profile.role !== "admin") {
    return redirect(`/dashboard/${profile.role}`);
  }

  return (
    <DashboardShell role="student" profile={profile} user={user}>
      {children}
    </DashboardShell>
  );
}
