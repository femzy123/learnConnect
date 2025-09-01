import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Choose your role — LearnConect" };

async function setRole(formData) {
  "use server";
  const role = String(formData.get("role") || "");
  if (!["student", "teacher"].includes(role)) redirect("/auth/select-role");

  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  await supabase.from("profiles").update({ role }).eq("id", user.id);
  await supabase.auth.updateUser({ data: { role } });

  // Send to Profile to complete required fields
  redirect(role === "teacher" ? "/dashboard/teacher/profile" : "/dashboard/student/profile");
}

export default async function SelectRolePage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <div className="min-h-screen px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-semibold">Choose your role</h1>
        <form action={setRole} className="grid gap-3">
          <button name="role" value="student" className="h-10 rounded-md border px-4 text-left hover:bg-accent">I’m a student</button>
          <button name="role" value="teacher" className="h-10 rounded-md border px-4 text-left hover:bg-accent">I’m a teacher</button>
        </form>
      </div>
    </div>
  );
}
