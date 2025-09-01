import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/server";
import RequestForm from "./RequestForm";

export const metadata = { title: "New learning request — LearnConect" };

export default async function NewRequestPage() {
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: categories = [] } = await supabase
    .from("categories")
    .select("id,name")
    .order("name", { ascending: true });

  const { data: subjects = [] } = await supabase
    .from("subjects")
    .select("id,name,category_id")
    .order("name", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New learning request</h1>
        <Button asChild variant="outline">
          <Link href="/dashboard/student">Back</Link>
        </Button>
      </div>

      <RequestForm categories={categories} subjects={subjects} />
    </div>
  );
}
