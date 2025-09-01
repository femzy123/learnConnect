"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function CertificatesList({ userId }) {
  const [files, setFiles] = useState([]);

  useEffect(() => {
    let alive = true;
    async function load() {
      const { data, error } = await supabase.storage
        .from("certificates")
        .list(`${userId}`, { limit: 100, offset: 0, sortBy: { column: "name", order: "asc" } });
      if (!alive) return;
      setFiles(error ? [] : (data || []));
    }
    if (userId) load();
    return () => { alive = false; };
  }, [userId]);

  async function getLink(name) {
    const { data } = await supabase.storage
      .from("certificates")
      .createSignedUrl(`${userId}/${name}`, 60);
    return data?.signedUrl;
  }

  if (!files.length) return <p className="text-sm text-muted-foreground">No certificates uploaded yet.</p>;

  return (
    <ul className="space-y-2 text-sm">
      {files.map((f) => (
        <li key={f.name} className="flex items-center justify-between rounded-md border p-2">
          <span className="truncate">{f.name}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const url = await getLink(f.name);
              if (url) window.open(url, "_blank");
            }}
          >
            View
          </Button>
        </li>
      ))}
    </ul>
  );
}
