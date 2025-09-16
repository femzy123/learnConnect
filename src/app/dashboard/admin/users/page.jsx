import { createClient } from "@/utils/supabase/server";
import UsersTabs from "./UsersTabs";
import { revalidatePath } from "next/cache";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage(props) {
  const searchParams = await props.searchParams;
  const defaultTab = (searchParams?.tab === "students") ? "students" : "teachers";
  const supabase = await createClient();

  const [{ data: teachersRaw = [] }, { data: studentsRaw = [] }] = await Promise.all([
    supabase
      .from("teacher_profiles")
      .select("user_id, vetting_status, hourly_rate, profiles:profiles(full_name, phone, account_status)"),
    supabase
      .from("profiles")
      .select("id, full_name, phone, account_status")
      .eq("role", "student"),
  ]);

  async function toggleAccountAction(formData) {
    "use server";
    const userId = String(formData.get("user_id") || "");
    const newStatus = String(formData.get("new_status") || "");
    if (!userId || !["active", "deactivated"].includes(newStatus)) return;

    const supabase = await createClient();
    await supabase.from("profiles").update({ account_status: newStatus }).eq("id", userId);
    revalidatePath("/dashboard/admin/users");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <UsersTabs
        defaultTab={defaultTab}
        teachersRaw={teachersRaw}
        studentsRaw={studentsRaw}
        toggleAccountAction={toggleAccountAction}
      />
    </div>
  );
}
