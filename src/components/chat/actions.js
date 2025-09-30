"use server";

import { createClient } from "@/utils/supabase/server";

// ✅ Direct form action signature: (formData)
export async function sendMessageAction(formData) {
  const supabase = await createClient();

  const sessionId = String(formData.get("session_id") || "");
  const content   = String(formData.get("content") || "").trim();

  if (!sessionId || !content) return { error: "Empty message." };

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: s } = await supabase
    .from("sessions")
    .select("id, student_id, teacher_id, payment_status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!s) return { error: "Session not found." };
  if (s.payment_status !== "paid") return { error: "Chat opens after payment." };
  if (user.id !== s.student_id && user.id !== s.teacher_id) return { error: "Not allowed." };

  const { error } = await supabase.from("messages").insert({
    session_id: s.id,
    sender_id: user.id,
    content,
  });

  if (error) return { error: error.message };
  return { ok: true };
}

/* Optional, for later if you pass a server action to a client comp:
export async function markSeenAction(sessionId) {
  "use server";
  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return;
  const { data: s } = await supabase
    .from("sessions")
    .select("id, student_id, teacher_id")
    .eq("id", sessionId)
    .maybeSingle();
  if (!s) return;
  const patch = user.id === s.student_id
    ? { student_last_seen_at: new Date().toISOString() }
    : { teacher_last_seen_at: new Date().toISOString() };
  await supabase.from("sessions").update(patch).eq("id", sessionId);
}
*/
