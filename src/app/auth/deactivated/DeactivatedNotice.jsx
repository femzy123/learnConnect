"use client";

import { useTransition } from "react";
import { supabase } from "@/utils/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function DeactivatedNotice() {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle>Account deactivated</AlertTitle>
        <AlertDescription>
          Your account is currently deactivated. If you believe this is a mistake,
          please contact support.
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button asChild variant="outline">
          <a href="/">Back to home</a>
        </Button>
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => start(async () => { await supabase.auth.signOut(); window.location.href = "/"; })}
        >
          {pending ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}
