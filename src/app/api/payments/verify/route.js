import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/payments/verify?ref=...
 * Authenticated student only.
 * - Looks up our transaction by (provider='paystack', reference=ref)
 * - Calls Paystack Verify on the server with PAYSTACK_SECRET_KEY
 * - On success, marks transaction 'success', session 'paid', request 'paid'
 * - Returns { paid, sessionId, requestId }
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const ref = searchParams.get("ref");
    if (!ref) return NextResponse.json({ error: "missing ref" }, { status: 400 });

    const supabase = await createClient();

    // Auth
    const { data: { user } = {} } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    // Find our transaction
    const { data: trx } = await supabase
      .from("transactions")
      .select("id, provider, reference, status, amount, currency, session_id, request_id, student_id, teacher_id")
      .eq("provider", "paystack")
      .eq("reference", ref)
      .maybeSingle();

    if (!trx) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (trx.student_id !== user.id) return NextResponse.json({ error: "forbidden" }, { status: 403 });

    // Short-circuit: already marked success
    if (trx.status === "success") {
      return NextResponse.json({ paid: true, sessionId: trx.session_id, requestId: trx.request_id });
    }

    // Verify with Paystack
    const secret = process.env.PAYSTACK_SECRET_KEY || "";
    if (!secret) return NextResponse.json({ error: "server not configured" }, { status: 500 });

    const resp = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(ref)}`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });

    const body = await resp.json().catch(() => ({}));
    // Paystack wraps response in {status:boolean, message, data:{...}}
    const pdata = body?.data;
    const pstatus = pdata?.status; // 'success' | 'failed' | 'abandoned' | ...
    const pamount = Number(pdata?.amount); // kobo
    const pcurrency = pdata?.currency || trx.currency;

    // Basic validations
    if (resp.ok && pstatus === "success" && Number.isFinite(pamount) && pamount === Number(trx.amount)) {
      // Mark success & persist raw payload (for audit)
      await supabase
        .from("transactions")
        .update({ status: "success", raw: body })
        .eq("id", trx.id);

      // Update session + request (idempotent)
      if (trx.session_id) {
        await supabase.from("sessions").update({ payment_status: "paid" }).eq("id", trx.session_id);
      }
      if (trx.request_id) {
        await supabase.from("student_requests").update({ status: "paid" }).eq("id", trx.request_id);
      }

      return NextResponse.json({
        paid: true,
        sessionId: trx.session_id,
        requestId: trx.request_id,
        currency: pcurrency,
      });
    }

    // If explicitly failed/abandoned, mark failed once
    if (resp.ok && (pstatus === "failed" || pstatus === "abandoned")) {
      await supabase.from("transactions").update({ status: "failed", raw: body }).eq("id", trx.id);
      return NextResponse.json({ paid: false, failed: true });
    }

    // Pending / not confirmed yet
    return NextResponse.json({ paid: false });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
