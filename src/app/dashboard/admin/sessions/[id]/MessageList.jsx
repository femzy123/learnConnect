"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { supabase } from "@/utils/supabase/client";

/**
 * AdminMessageList (read-only)
 * - Always Teacher on the RIGHT, Student on the LEFT
 * - No composer, no optimistic UI
 * - Streams new messages via Supabase Realtime
 *
 * Props:
 *  - sessionId: string (required)
 *  - participants: {
 *      [userId]: { name: string, role: "Student" | "Teacher" }
 *    }
 */
export default function AdminMessageList({ sessionId, participants = {} }) {
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  // initial load
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, session_id, sender_id, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true })
        .limit(500);
      if (mounted) setMessages(data ?? []);
      // jump to bottom once
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "auto" }), 0);
    })();
    return () => {
      mounted = false;
    };
  }, [sessionId, supabase]);

  // realtime
  useEffect(() => {
    const channel = supabase
      .channel(`messages:admin:${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
          // nudge to bottom on new message
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, supabase]);

  // left/right rule for admin: Teacher -> right, Student -> left
  const sideFor = (senderId) => (participants[senderId]?.role === "Teacher" ? "right" : "left");

  // (optional) group consecutive by sender so the name doesn’t repeat every line
  const groups = useMemo(() => {
    const out = [];
    let cur = null;
    for (const m of messages) {
      if (!cur || cur.sender_id !== m.sender_id) {
        cur = { sender_id: m.sender_id, items: [m] };
        out.push(cur);
      } else {
        cur.items.push(m);
      }
    }
    return out;
  }, [messages]);

  const displayName = (senderId) =>
    participants[senderId]?.name ?? participants[senderId]?.role ?? "Unknown";

  return (
    <div className="h-full overflow-y-auto p-4">
      {groups.length === 0 && (
        <div className="h-full grid place-items-center text-muted-foreground text-sm">
          No messages yet.
        </div>
      )}

      {groups.map((g) => {
        const side = sideFor(g.sender_id);
        const name = displayName(g.sender_id);
        return (
          <div
            key={`${g.sender_id}-${g.items[0].id}`}
            className={clsx("mb-4 flex", side === "right" ? "justify-end" : "justify-start")}
          >
            <div className={clsx("space-y-1 max-w-[80%]", side === "right" ? "text-right items-end" : "text-left items-start")}>
              <div className="text-xs text-muted-foreground font-medium">
                {name} {participants[g.sender_id]?.role ? `· ${participants[g.sender_id].role}` : ""}
              </div>

              {g.items.map((m) => (
                <div
                  key={m.id}
                  className={clsx(
                    "rounded-2xl px-3 py-2 border",
                    side === "right" ? "bg-primary text-primary-foreground border-primary ml-auto" : "bg-background"
                  )}
                >
                  {/* content sanitized on insert; safe to render as HTML */}
                  <div dangerouslySetInnerHTML={{ __html: m.content }} />
                  <div className="mt-1 text-[10px] opacity-70">
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
