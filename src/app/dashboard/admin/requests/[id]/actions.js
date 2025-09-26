"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function inviteTeachersAction(prevState, formData) {
  const supabase = await createClient();

  const requestId = String(formData.get("request_id") || "");
  const subjectId = Number(formData.get("subject_id") || 0);
  const ids = formData.getAll("teacher_ids").map(String).filter(Boolean);

  if (!requestId || !subjectId || ids.length === 0) {
    return { error: "Select at least one teacher." };
  }

  const { data: existing = [] } = await supabase
    .from("teacher_proposals")
    .select("teacher_id")
    .eq("request_id", requestId);

  const already = new Set(existing.map(e => e.teacher_id));
  const toInsert = ids
    .filter(id => !already.has(id))
    .map(teacherId => ({ request_id: requestId, teacher_id: teacherId, status: "invited" }));

  if (!toInsert.length) return { ok: true, info: "All selected teachers were already invited." };

  const { error } = await supabase.from("teacher_proposals").insert(toInsert);
  if (error) return { error: error.message };

  revalidatePath(`/dashboard/admin/requests/${requestId}`);
  return { ok: true, count: toInsert.length };
}
