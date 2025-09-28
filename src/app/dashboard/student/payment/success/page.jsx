import Link from "next/link";
import { Button } from "@/components/ui/button";
import PaymentVerifyWatcher from "./PaymentVerifyWatcher";

export const metadata = { title: "Payment success — LearnConect" };

export default function PaymentSuccessPage({ searchParams }) {
  const { ref } = searchParams || {};

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Thanks! We’re verifying your payment…</h1>
      {ref && (
        <>
          <p className="text-sm text-muted-foreground">
            Reference: <code>{ref}</code>
          </p>
          <PaymentVerifyWatcher reference={ref} to="session" />
        </>
      )}
      <p className="text-sm text-muted-foreground">
        You’ll be redirected automatically once confirmation is complete.
      </p>
      <div className="pt-2 flex justify-center gap-2">
        <Button asChild variant="outline">
          <Link href="/dashboard/student">Go to dashboard</Link>
        </Button>
        <Button asChild>
          <Link href="/dashboard/student/requests">View requests</Link>
        </Button>
      </div>
    </div>
  );
}
