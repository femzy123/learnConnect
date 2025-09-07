import { createClient } from "@/utils/supabase/server";
import UsersTabs from "./UsersTabs";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage(props) {
  // await props.searchParams to satisfy your requirement (await on non-Promise is fine)
  const searchParams = await props.searchParams;
  const defaultTab = (searchParams?.tab === "students") ? "students" : "teachers";

  const supabase = await createClient();

  const [{ data: teachersRaw = [] }, { data: studentsRaw = [] }] = await Promise.all([
    supabase
      .from("teacher_profiles")
      .select("user_id, vetting_status, hourly_rate, profiles:profiles(full_name, phone)"),
    supabase
      .from("profiles")
      .select("id, full_name, phone")
      .eq("role", "student"),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <UsersTabs defaultTab={defaultTab} teachersRaw={teachersRaw} studentsRaw={studentsRaw} />
    </div>
  );
}
