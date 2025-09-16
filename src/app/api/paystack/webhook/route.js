import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/utils/supabase/server";
import { paystackVerify } from "@/utils/payments/paystack";

// Capture raw body to validate signature
export async function POST(req) {
  const raw = await req.text();
  const sig = req.headers.get("x-paystack-signature") || "";
  const mySig = crypto.createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(raw).digest("hex");
  if (sig !== mySig) return NextResponse.json({ ok: false }, { status: 401 });

  const event = JSON.parse(raw);
  if (event?.event !== "charge.success") return NextResponse.json({ ok: true });

  const reference = event?.data?.reference;
  if (!reference) return NextResponse.json({ ok: true });

  // Double-check with Verify API
  let verified;
  try { verified = await paystackVerify(reference); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (verified.status !== "success") return NextResponse.json({ ok: true });

  const meta = verified?.metadata || {};
  const request_id = meta.request_id;
  const session_id = meta.session_id;
  const student_id = meta.student_id;
  const teacher_id = meta.teacher_id;

  const supabase = await createClient();

  // 1) Upsert transaction record
  await supabase
    .from("transactions")
    .upsert({
      reference,
      provider: "paystack",
      request_id,
      session_id,
      student_id,
      teacher_id,
      amount: verified.amount,
      currency: verified.currency || "NGN",
      status: "success",
      raw: verified,
    }, { onConflict: "reference" });

  // 2) Mark request paid
  if (request_id) {
    await supabase.from("student_requests").update({ status: "paid" }).eq("id", request_id);
  }

  return NextResponse.json({ ok: true });
}
