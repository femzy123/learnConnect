"use server";

import { createClient } from "@/utils/supabase/server";

// Creates/ensures a session + inserts an initialized transaction, returns data for Paystack inline
export async function initPaymentAction(prev, formData) {
  const supabase = await createClient();

  const sessionId = String(formData.get("session_id") || "");
  if (!sessionId) return { error: "Missing session id." };

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  // Load the session and ensure it belongs to this student
  const { data: s, error: sErr } = await supabase
    .from("sessions")
    .select("id, request_id, student_id, teacher_id, price_amount, duration_minutes, payment_status")
    .eq("id", sessionId)
    .single();

  if (sErr || !s) return { error: "Session not found." };
  if (s.student_id !== user.id) return { error: "Not allowed." };
  if (!s.price_amount) return { error: "No amount set for this session." };

  // Insert/ensure a transaction record for this attempt
  const reference = `LC_${s.id}_${Date.now()}`; // unique-enough for MVP
  const { error: tErr } = await supabase.from("transactions").insert({
    provider: "paystack",
    reference,
    amount: s.price_amount,     // kobo
    currency: "NGN",
    status: "initialized",
    session_id: s.id,
    request_id: s.request_id,
    student_id: s.student_id,
    teacher_id: s.teacher_id,
  });
  if (tErr) return { error: tErr.message };

  // Return what the client needs to open Paystack
  return {
    ok: true,
    reference,
    amount: s.price_amount,       // kobo
    email: user.email || "",      // Paystack requires email
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    requestId: s.request_id,
    sessionId: s.id,
  };
}
