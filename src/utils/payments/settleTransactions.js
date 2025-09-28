// Server-only utility to verify Paystack transactions and settle DB rows
export async function settleStudentTransactions(supabase, userId, { lookbackMinutes = 120, limit = 10 } = {}) {
  if (!userId) return { checked: 0, settled: 0 };
  const secret = process.env.PAYSTACK_SECRET_KEY || "";
  if (!secret) return { checked: 0, settled: 0 }; // not configured in dev

  const sinceISO = new Date(Date.now() - lookbackMinutes * 60_000).toISOString();

  // Grab recent "initialized" transactions for this student (Paystack only)
  const { data: pending = [], error: qErr } = await supabase
    .from("transactions")
    .select("id, provider, reference, status, amount, currency, session_id, request_id")
    .eq("student_id", userId)
    .eq("provider", "paystack")
    .eq("status", "initialized")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (qErr || !pending.length) return { checked: 0, settled: 0 };

  let settled = 0;

  for (const trx of pending) {
    try {
      const resp = await fetch(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(trx.reference)}`,
        { headers: { Authorization: `Bearer ${secret}` }, cache: "no-store" }
      );
      const body = await resp.json().catch(() => ({}));
      const data = body?.data;
      const ok = resp.ok && data?.status === "success";
      const amtOk = Number.isFinite(Number(data?.amount)) && Number(data.amount) === Number(trx.amount);
      const curOk = trx.currency ? (data?.currency === trx.currency) : true;

      if (ok && amtOk && curOk) {
        // Mark transaction success & persist raw
        await supabase.from("transactions")
          .update({ status: "success", raw: body })
          .eq("id", trx.id);

        // Update session / request idempotently
        if (trx.session_id) {
          await supabase.from("sessions")
            .update({ payment_status: "paid" })
            .eq("id", trx.session_id);
        }
        if (trx.request_id) {
          await supabase.from("student_requests")
            .update({ status: "paid" })
            .eq("id", trx.request_id);
        }

        settled++;
      } else if (resp.ok && (data?.status === "failed" || data?.status === "abandoned")) {
        // Mark failed to stop rechecking
        await supabase.from("transactions")
          .update({ status: "failed", raw: body })
          .eq("id", trx.id);
      }
    } catch {
      // swallow and continue; we'll retry on next dashboard load
    }
  }

  return { checked: pending.length, settled };
}
