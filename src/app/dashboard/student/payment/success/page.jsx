import { createClient } from "@/utils/supabase/server";
import { paystackVerify } from "@/utils/payments/paystack";
import { redirect } from "next/navigation";

export default async function SuccessPage({ searchParams }) {
  const sp = await searchParams;
  const ref = sp?.ref;
  if (!ref) redirect("/dashboard/student");

  // Verify as a fallback
  try {
    const data = await paystackVerify(ref);
    if (data.status === "success") {
      const supabase = await createClient();
      const meta = data.metadata || {};
      if (meta.request_id) {
        await supabase.from("student_requests").update({ status: "paid" }).eq("id", meta.request_id);
      }
      await supabase.from("transactions").upsert({
        reference: ref,
        status: "success",
        raw: data,
        currency: data.currency || "NGN",
        amount: data.amount,
      }, { onConflict: "reference" });
    }
  } catch { /* ignore; webhook will catch up */ }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Payment received</h1>
        <p className="text-sm text-muted-foreground">We’ve updated your request. You can now schedule with your teacher.</p>
        <a className="underline" href="/dashboard/student">Go to dashboard</a>
      </div>
    </div>
  );
}
