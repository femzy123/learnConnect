import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TeacherProfileForm from "./TeacherProfileForm";
import RedirectToast from "@/components/RedirectToast";
import CompletionBanner from "@/components/CompletionBanner";

export const metadata = { title: "Teacher profile — LearnConect" };

export default async function TeacherProfilePage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();

  // ✅ guard: don't query with empty id; send to login if needed
  if (!user) redirect("/auth/login");

  const [
    { data: categories = [] },
    { data: subjects = [] },
    { data: baseProfile },
    { data: tprof },
    { data: ts = [] },
  ] = await Promise.all([
    supabase.from("categories").select("id,name").order("name", { ascending: true }),
    supabase.from("subjects").select("id,name,category_id").order("name", { ascending: true }),
    supabase.from("profiles").select("full_name, avatar_url, phone").eq("id", user.id).single(),
    supabase.from("teacher_profiles").select("bio, vetting_status").eq("user_id", user.id).maybeSingle(),
    supabase.from("teacher_subjects").select("subject_id").eq("teacher_user_id", user.id),
  ]);

  const selectedSubjectIds = ts.map((t) => t.subject_id);

  const missing = [];
  if (!baseProfile?.full_name) missing.push("name");
  if (!baseProfile?.phone) missing.push("phone");
  if (!baseProfile?.avatar_url) missing.push("profile photo");
  if (!tprof?.bio) missing.push("bio");
  if (!selectedSubjectIds?.length) missing.push("at least one subject");
  const mustComplete = missing.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile {tprof ? "" : "(finish onboarding)"}</h1>
        <p className="text-sm text-muted-foreground">
          Vetting status: <strong className="capitalize">{tprof?.vetting_status || "pending"}</strong>
        </p>
      </div>

      <RedirectToast role="teacher" />
      <CompletionBanner mustComplete={mustComplete} missing={missing} />

      <TeacherProfileForm
        userId={user.id}
        baseProfile={baseProfile}
        teacherProfile={tprof}
        selectedSubjectIds={selectedSubjectIds}
        categories={categories}
        subjects={subjects}
      />
    </div>
  );
}
