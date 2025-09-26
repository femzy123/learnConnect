"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import AuthErrorAlert from "@/components/AuthErrorAlert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProposalForm({
  proposalId,
  initialFee,
  initialDuration,
  initialNote,
  onSave, // server action passed from the page
}) {
  const [state, formAction, pending] = useActionState(onSave, {});

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border p-4">
      <input type="hidden" name="proposal_id" value={proposalId} />
      <AuthErrorAlert title="Couldn’t save proposal" message={state?.error} />

      <div className="grid gap-2">
        <label htmlFor="fee" className="text-sm">Proposed fee (NGN)</label>
        <Input
          id="fee"
          name="fee"
          inputMode="decimal"
          placeholder="e.g., 10000"
          defaultValue={initialFee}
        />
        <p className="text-xs text-muted-foreground">
          Enter the total amount for this session (we’ll convert to kobo for Paystack).
        </p>
      </div>

      <div className="grid gap-2">
        <label htmlFor="duration" className="text-sm">Duration (minutes)</label>
        <Input
          id="duration"
          name="duration"
          inputMode="numeric"
          placeholder="e.g., 60"
          defaultValue={initialDuration}
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="note" className="text-sm">Note (optional)</label>
        <Textarea
          id="note"
          name="note"
          placeholder="Short note about your plan or prerequisites…"
          defaultValue={initialNote}
        />
      </div>

      <div className="flex gap-2">
        <Button disabled={pending} type="submit">
          {pending ? "Saving…" : "Save & submit"}
        </Button>
        <span className="self-center text-sm text-muted-foreground">
          {state?.ok ? "Saved." : ""}
        </span>
      </div>
    </form>
  );
}
