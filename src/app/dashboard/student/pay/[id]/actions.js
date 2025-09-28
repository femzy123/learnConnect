"use server";

import { createClient } from "@/utils/supabase/server";

export async function initPaymentAction(prev, formData) {
  const supabase = await createClient();

  const sessionId = String(formData.get("session_id") || "");
  if (!sessionId) return { error: "Missing session id." };

  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated." };

  const { data: s, error: sErr } = await supabase
    .from("sessions")
    .select("id, request_id, student_id, teacher_id, price_amount")
    .eq("id", sessionId)
    .single();

  if (sErr || !s) return { error: "Session not found." };
  if (s.student_id !== user.id) return { error: "Not allowed." };
  if (!s.price_amount) return { error: "No amount set for this session." };

  // --- NEW: Ask Paystack to initialize and give us the official reference
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  if (!secret) return { error: "Server not configured." };

  const initResp = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: user.email,
      amount: Number(s.price_amount),   // kobo
      currency: "NGN",
      // helpful to bind payment back to our domain
      metadata: {
        custom_fields: [
          { display_name: "Session ID",  variable_name: "session_id",  value: s.id },
          { display_name: "Request ID",  variable_name: "request_id",  value: s.request_id },
        ],
      },
    }),
  });

  const initJson = await initResp.json().catch(() => ({}));
  const ref = initJson?.data?.reference;
  if (!initResp.ok || !ref) {
    return { error: initJson?.message || "Failed to initialize Paystack transaction." };
  }

  // Insert our transaction with Paystack’s reference (idempotent via unique index)
  const { error: tErr } = await supabase.from("transactions").insert({
    provider: "paystack",
    reference: ref,
    amount: s.price_amount,     // kobo
    currency: "NGN",
    status: "initialized",
    session_id: s.id,
    request_id: s.request_id,
    student_id: s.student_id,
    teacher_id: s.teacher_id,
  });
  if (tErr) return { error: tErr.message };

  return {
    ok: true,
    reference: ref,                                   // ← use Paystack reference
    amount: s.price_amount,
    email: user.email || "",
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "",
    requestId: s.request_id,
    sessionId: s.id,
  };
}
