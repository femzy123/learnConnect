"use client";

import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function AuthErrorAlert({ title = "Something went wrong", message }) {
  if (!message) return null;
  return (
    <Alert variant="destructive" className="text-sm">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
