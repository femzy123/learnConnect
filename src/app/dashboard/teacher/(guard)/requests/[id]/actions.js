"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function saveProposalAction(prevState, formData) {
  const supabase = await createClient();

  const proposalId = String(formData.get("proposal_id") || "");
  const feeNGN = String(formData.get("fee") || "").replace(/,/g, "");
  const duration = Number(formData.get("duration") || 0);
  const note = String(formData.get("note") || "").trim();

  if (!proposalId || !feeNGN || !duration) {
    return { error: "Fee (NGN) and duration are required." };
  }

  const fee_amount = Math.round(Number(feeNGN) * 100); // NGN → kobo
  if (!Number.isFinite(fee_amount) || fee_amount <= 0) {
    return { error: "Enter a valid fee in NGN." };
  }
  if (!Number.isFinite(duration) || duration < 15) {
    return { error: "Duration should be at least 15 minutes." };
  }

  // Owns proposal?
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: existing } = await supabase
    .from("teacher_proposals")
    .select("id, teacher_id")
    .eq("id", proposalId)
    .maybeSingle();

  if (!existing || existing.teacher_id !== user.id) {
    return { error: "You don’t have access to this proposal." };
  }

  const { error } = await supabase
    .from("teacher_proposals")
    .update({
      fee_amount,
      duration_minutes: duration,
      note,
      status: "submitted",
    })
    .eq("id", proposalId);

  if (error) return { error: error.message };

  // Refresh detail + list
  revalidatePath(`/dashboard/teacher/requests/${proposalId}`);
  revalidatePath(`/dashboard/teacher/requests`);
  return { ok: true };
}
