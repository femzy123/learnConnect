"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/utils/supabase/client";

export default function MessageList({ sessionId, currentUserId, emptyText }) {
  const [messages, setMessages] = useState([]);
  const scroller = useRef(null);

  // Merge new rows and keep oldest → newest
  const append = (rows) => {
    setMessages((prev) => {
      const byId = new Map(prev.map((m) => [m.id, m]));
      for (const r of rows) byId.set(r.id, r);
      return Array.from(byId.values()).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    });
  };

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      // Fetch last 50 quickly (desc), append will re-sort asc for display
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (!cancelled && !error && data) append(data);
    }
    loadInitial();

    // Realtime sub
    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => append([payload.new])
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Empty state
  if (messages.length === 0) {
    return (
      <div
        ref={scroller}
        className="h-[60vh] overflow-y-auto rounded-xl border p-6 bg-muted/20"
      >
        <p className="text-sm text-muted-foreground">
          {emptyText || "No messages yet."}
        </p>
      </div>
    );
  }

  return (
    <div
      ref={scroller}
      className="h-[60vh] overflow-y-auto rounded-xl border p-3 md:p-4 space-y-2 bg-muted/10"
    >
      {messages.map((m) => {
        const mine = m.sender_id === currentUserId;
        return (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
              mine
                ? "w-max ml-auto bg-primary text-primary-foreground rounded-br-sm"
                : "bg-white border rounded-bl-sm"
            }`}
          >
            <div className="whitespace-pre-wrap break-words">{m.content}</div>
            <div className="mt-1 text-[10px] opacity-70">
              {new Date(m.created_at).toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
