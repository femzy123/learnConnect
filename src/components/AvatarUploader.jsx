"use client";

import { useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function AvatarUploader({ userId, currentUrl, onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUrl || "");

  async function handleChange(e) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar_${Date.now()}.${ext}`;

    const bucket = supabase.storage.from("avatars");
    const { error: upErr } = await bucket.upload(path, file, { upsert: true });
    if (upErr) { setUploading(false); return; }

    const { data } = bucket.getPublicUrl(path);
    const url = data?.publicUrl || "";
    setPreview(url);
    setUploading(false);
    onUploaded?.(url);
  }

  return (
    <div className="flex items-center gap-3">
      <img
        src={preview || "/avatar-placeholder.png"}
        alt="Avatar preview"
        className="h-14 w-14 rounded-full border object-cover"
      />
      <div>
        <input type="file" accept="image/*" onChange={handleChange} />
        <p className="text-xs text-muted-foreground">
          Required. JPG/PNG recommended.
        </p>
        {uploading && <p className="text-xs">Uploading…</p>}
      </div>
    </div>
  );
}
