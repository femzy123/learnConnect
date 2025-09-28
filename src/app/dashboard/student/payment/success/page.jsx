import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Payment success — LearnConect" };

export default function PaymentSuccessPage({ searchParams }) {
  const { ref } = searchParams || {};
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center space-y-4">
      <h1 className="text-2xl font-semibold">Thanks! We’re verifying your payment.</h1>
      {ref && <p className="text-sm text-muted-foreground">Reference: <code>{ref}</code></p>}
      <p className="text-sm text-muted-foreground">
        You’ll be redirected once verification completes.
      </p>
      <div className="pt-2">
        <Button asChild>
          <Link href="/dashboard/student">Go to dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
