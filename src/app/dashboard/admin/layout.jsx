import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";

export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    // If they're a student/teacher, send them to their own dashboard.
    const role = profile?.role || "student";
    return redirect(`/dashboard/${role}`);
  }

  return (
    <DashboardShell role="admin" profile={profile} user={user}>
      {children}
    </DashboardShell>
  );
}
