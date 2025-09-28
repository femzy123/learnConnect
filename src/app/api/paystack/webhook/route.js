import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic"; // no caching

export async function POST(req) {
  try {
    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    const raw = await req.text();
    const signature = req.headers.get("x-paystack-signature") || "";

    const expected = crypto.createHmac("sha512", secret).update(raw).digest("hex");
    if (signature !== expected) {
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(raw);
    if (event?.event !== "charge.success") {
      return NextResponse.json({ ok: true }); // ignore other events
    }

    const ref = event?.data?.reference;
    if (!ref) return NextResponse.json({ ok: true });

    const supabase = await createClient();

    // Mark transaction success + fetch related IDs
    const { data: trx } = await supabase
      .from("transactions")
      .update({ status: "success", raw: event })
      .eq("provider", "paystack")
      .eq("reference", ref)
      .select("id, session_id, request_id")
      .maybeSingle();

    // Update session/request status
    if (trx?.session_id) {
      await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", trx.session_id);
    }
    if (trx?.request_id) {
      await supabase.from("student_requests").update({ status: "paid" }).eq("id", trx.request_id);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
