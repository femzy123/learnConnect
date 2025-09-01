"use client";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function CompletionBanner({ mustComplete, missing = [] }) {
  if (!mustComplete) return null;
  return (
    <Alert className="border-amber-300 bg-amber-50">
      <Info className="h-4 w-4" />
      <AlertTitle>Complete your profile to continue</AlertTitle>
      <AlertDescription>
        Missing: {missing.join(", ")}.
      </AlertDescription>
    </Alert>
  );
}
// Example usage: <CompletionBanner mustComplete={true} missing={['photo', 'phone']} />