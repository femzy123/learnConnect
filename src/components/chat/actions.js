"use server";

import { createClient } from "@/utils/supabase/server";
import sanitizeHtml from "sanitize-html";

export async function sendMessageAction(formData) {
  const supabase = await createClient();

  const sessionId = String(formData.get("session_id") || "");
  const rawContent = String(formData.get("content") || "");

  // sanitize on server
  const safe = sanitizeHtml(rawContent, {
    allowedTags: [
      "b","i","u","strong","em","a","p","br","ul","ol","li","code","pre","blockquote","span"
    ],
    allowedAttributes: {
      a: ["href","target","rel"],
      span: ["style"], // future-proof; not required now
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });

  const plain = safe.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!sessionId || !plain) return { error: "Empty message." };

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
    content: safe,
  });

  if (error) return { error: error.message };
  return { ok: true };
}
