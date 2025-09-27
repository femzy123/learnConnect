import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/ui/button";
import { paystackInit } from "@/utils/payments/paystack";

/* ---------- page ---------- */
export const metadata = { title: "Checkout — LearnConect" };

export default async function PayPage({ params }) {
  const pr = await params;
  const requestId = pr.id;

  // const supabase = await createClient();
  // const { data: { user } = {} } = await supabase.auth.getUser();
  // if (!user) redirect("/auth/login");

  // const [{ data: req }, { data: session }] = await Promise.all([
  //   supabase.from("student_requests")
  //     .select("id, student_id, topic, status")
  //     .eq("id", requestId).single(),
  //   supabase.from("sessions").select("id, rate").eq("request_id", requestId).maybeSingle(),
  // ]);
  // if (!req || req.student_id !== user.id) redirect("/dashboard/student");
  // if (req.status !== "awaiting_payment") redirect(`/dashboard/student/requests/${requestId}`);

  // const amountMinor = Number(session?.rate || 0);
  // const amount = `₦${(amountMinor / 100).toLocaleString()}`;

  return (
    <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <Button asChild variant="outline">
          <Link href={`/dashboard/student/requests/${requestId}`}>← Back</Link>
        </Button>
      </div>

      {/* <div className="rounded-2xl border p-4 text-sm space-y-1">
        <div><span className="text-muted-foreground">Topic:</span> <strong>{req.topic}</strong></div>
        <div><span className="text-muted-foreground">Amount:</span> <strong>{amount}</strong></div>
        <p className="text-xs text-muted-foreground">Paying 1 hour upfront at the teacher’s locked rate.</p>
      </div> */}

      {/* <PayButton requestId={requestId} initPayAction={initPayAction} /> */}
    </div>
  );
}

// /* ---------- client bridge ---------- */
// "use client";
// import { useActionState, useEffect } from "react";

// function PayButton({ requestId, initPayAction }) {
//   const [state, formAction, pending] = useActionState(initPayAction, {});

//   useEffect(() => {
//     if (state?.url) window.location.href = state.url;
//   }, [state?.url]);

//   return (
//     <form action={formAction} className="space-y-3">
//       <input type="hidden" name="request_id" value={requestId} />
//       {state?.error && (
//         <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm">
//           {state.error}
//         </div>
//       )}
//       <Button type="submit" className="w-full" disabled={pending}>
//         {pending ? "Preparing..." : "Pay with Paystack"}
//       </Button>
//     </form>
//   );
// }
