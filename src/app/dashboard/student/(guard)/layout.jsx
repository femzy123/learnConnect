import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function StudentGuardLayout({ children }) {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, avatar_url")
    .eq("id", user.id)
    .single();

  // Only student or admin can be here
  if (profile?.role !== "student" && profile?.role !== "admin") {
    redirect(`/dashboard/${profile?.role || "student"}`);
  }

  // Require name, phone, avatar
  const incomplete = !profile?.full_name || !profile?.phone || !profile?.avatar_url;
  if (incomplete) redirect("/dashboard/student/profile?incomplete=1");

  return <>{children}</>;
}
