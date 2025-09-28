import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PayButton from "./PayButton";
import { initPaymentAction } from "./actions";

export const metadata = { title: "Payment — LearnConect" };

export default async function StudentPayPage({ params }) {
  const { id: sessionId } = await params;

  const supabase = await createClient();
  const { data: { user } = {} } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Load session & verify ownership
  const { data: s } = await supabase
    .from("sessions")
    .select("id, request_id, student_id, price_amount, payment_status")
    .eq("id", sessionId)
    .maybeSingle();

  if (!s) return notFound();
  if (s.student_id !== user.id) redirect("/dashboard/student");

  // Compute NGN display
  const amountNGN = s.price_amount != null
    ? (Number(s.price_amount) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "—";

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payment</h1>
        <Button asChild variant="outline">
          <Link href={`/dashboard/student/requests/${s.request_id}`}>← Back to request</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3 text-sm">
          <div className="text-muted-foreground">Amount</div>
          <div className="text-xl font-semibold">₦{amountNGN}</div>
          <div className="text-muted-foreground">Session</div>
          <div className="font-medium">{s.id}</div>
          <div className="pt-2">
            <PayButton sessionId={s.id} onInit={initPaymentAction} />
          </div>
          {s.payment_status === "paid" && (
            <div className="text-green-600 text-sm pt-2">Payment already completed.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
