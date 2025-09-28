"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the verify API until paid, then redirects.
 * Falls back after ~60s with no redirect.
 */
export default function PaymentVerifyWatcher({ reference, to = "session" }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function tick() {
      try {
        const res = await fetch(`/api/payments/verify?ref=${encodeURIComponent(reference)}`, { cache: "no-store" });
        const data = await res.json();
        if (data?.paid) {
          const sessionId = data.sessionId;
          const requestId = data.requestId;
          if (to === "session" && sessionId) {
            router.replace(`/dashboard/student/sessions/${sessionId}?paid=1`);
          } else if (requestId) {
            router.replace(`/dashboard/student/requests/${requestId}?paid=1`);
          } else {
            router.replace(`/dashboard/student`);
          }
          return;
        }
      } catch (_) {} // swallow & retry

      if (!cancelled && tries < 40) {
        setTimeout(() => {
          setTries((t) => t + 1);
          tick();
        }, 1500); // ~60s budget
      }
    }

    tick();
    return () => { cancelled = true; };
  }, [reference, to, router]);

  return null;
}
