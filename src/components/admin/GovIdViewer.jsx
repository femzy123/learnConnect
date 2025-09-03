"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";

export default function GovIdViewer({ userId }) {
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .storage
        .from("vetting_docs")
        .list(`${userId}`, { limit: 100, sortBy: { column: "name", order: "asc" } });
      if (!alive) return;
      if (error) { setIds([]); setLoading(false); return; }
      setIds((data || []).filter((f) => f.name.startsWith("id_")));
      setLoading(false);
    }
    if (userId) load();
    return () => { alive = false; };
  }, [userId]);

  async function openSigned(name) {
    const { data, error } = await supabase
      .storage
      .from("vetting_docs")
      .createSignedUrl(`${userId}/${name}`, 60);
    if (!error && data?.signedUrl) window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!ids.length) return <p className="text-sm text-muted-foreground">No ID uploaded.</p>;

  return (
    <ul className="space-y-2 text-sm">
      {ids.map((f) => (
        <li key={f.name} className="flex items-center justify-between rounded-md border p-2">
          <span className="truncate">{f.name}</span>
          <Button variant="outline" size="sm" onClick={() => openSigned(f.name)}>
            View
          </Button>
        </li>
      ))}
    </ul>
  );
}
