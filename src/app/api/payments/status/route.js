import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const ref = searchParams.get("ref");
  if (!ref) return NextResponse.json({ error: "missing ref" }, { status: 400 });

  const supabase = await createClient();

  const { data: trx } = await supabase
    .from("transactions")
    .select("status, session_id, request_id")
    .eq("provider", "paystack")
    .eq("reference", ref)
    .maybeSingle();

  if (!trx) return NextResponse.json({ found: false, paid: false });

  let paid = trx.status === "success";
  if (!paid && trx.session_id) {
    const { data: s } = await supabase
      .from("sessions")
      .select("payment_status")
      .eq("id", trx.session_id)
      .maybeSingle();
    paid = paid || s?.payment_status === "paid";
  }

  return NextResponse.json({
    found: true,
    paid,
    sessionId: trx.session_id,
    requestId: trx.request_id,
  });
}
