import { createClient } from "@/utils/supabase/server";
import StudentProfileForm from "./StudentProfileForm";
import RedirectToast from "@/components/RedirectToast";
import CompletionBanner from "@/components/CompletionBanner";

export const metadata = { title: "Student profile — LearnConect" };

export default async function StudentProfilePage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, phone")
    .eq("id", user?.id || "")
    .single();

  const missing = [];
  if (!profile?.full_name) missing.push("name");
  if (!profile?.phone) missing.push("phone");
  if (!profile?.avatar_url) missing.push("profile photo");
  const mustComplete = missing.length > 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your details are shared with your teacher after a match.
        </p>
      </div>

      <RedirectToast role="student" />
      <CompletionBanner mustComplete={mustComplete} missing={missing} />

      <StudentProfileForm userId={user?.id} baseProfile={profile} />
    </div>
  );
}
