"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentStatusWatcher({ reference }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/payments/status?ref=${encodeURIComponent(reference)}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (data?.paid && data?.requestId) {
          router.replace(`/dashboard/student/sessions/${data.sessionId}?paid=1`);
          return;
        }
      } catch (_) {
        // ignore and retry
      }
      if (!cancelled && tries < 40) {
        setTimeout(() => {
          setTries((t) => t + 1);
          poll();
        }, 1500); // ~60s max
      }
    }

    poll();
    return () => { cancelled = true; };
  }, [reference, router]);

  return null;
}
