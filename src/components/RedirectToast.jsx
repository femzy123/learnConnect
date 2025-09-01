"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function RedirectToast({ role }) {
  const sp = useSearchParams();

  useEffect(() => {
    if (sp.get("incomplete") === "1") {
      const msg =
        role === "teacher"
          ? "Add a photo, phone, bio, rate, and at least one subject."
          : "Add a photo and phone number.";
      toast("Please complete your profile", { description: msg });
    }
  }, [sp, role]);

  return null;
}
