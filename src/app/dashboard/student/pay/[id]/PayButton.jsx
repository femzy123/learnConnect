"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function loadPaystack() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.PaystackPop) return resolve();
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Paystack script"));
    document.body.appendChild(script);
  });
}

export default function PayButton({ sessionId, onInit }) {
  const [state, formAction, pending] = useActionState(onInit, {});
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    loadPaystack().then(() => setScriptReady(true)).catch(() => setScriptReady(false));
  }, []);

  // Open Paystack when server action returns the init payload
  useEffect(() => {
    if (!state?.ok || !scriptReady || !window?.PaystackPop) return;

    const handler = window.PaystackPop.setup({
      key: state.publicKey,         // NEXT_PUBLIC key (also returned from server for convenience)
      email: state.email,
      amount: Number(state.amount), // in kobo
      currency: "NGN",
      reference: state.reference,
      ref: state.reference, 
      metadata: {
        custom_fields: [
          { display_name: "Session ID", variable_name: "session_id", value: state.sessionId },
          { display_name: "Request ID", variable_name: "request_id", value: state.requestId },
        ],
      },
      callback: function (resp) {
        // Client callback — we defer final confirmation to webhook
        window.location.href = `/dashboard/student/payment/success?ref=${encodeURIComponent(resp.reference)}`;
      },
      onClose: function () {
        // Optional: you could toast "Payment window closed"
      },
    });

    handler.openIframe();
  }, [state, scriptReady]);

  return (
    <form action={formAction}>
      <input type="hidden" name="session_id" value={sessionId} />
      <Button type="submit" disabled={pending || !scriptReady}>
        {pending ? "Starting…" : "Pay with Paystack"}
      </Button>
    </form>
  );
}
