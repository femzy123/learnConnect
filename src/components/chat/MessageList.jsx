"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { supabase } from "@/utils/supabase/client";

// Simple relative time (seconds → years)
function formatRelative(iso) {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000; // seconds
  const units = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
    ["second", 1],
  ];
  for (const [unit, sec] of units) {
    if (diff >= sec || unit === "second") {
      const val = Math.floor(diff / sec);
      const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
      return rtf.format(-val, unit);
    }
  }
  return d.toLocaleString();
}

function escapeToHtml(s) {
  if (!s) return "";
  // if it already contains tags, assume server-sanitized HTML
  if (s.includes("<")) return s;
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
}

const MessageList = forwardRef(function MessageList(
  { sessionId, currentUserId, emptyText, meAvatarUrl, otherAvatarUrl },
  ref
) {
  const [messages, setMessages] = useState([]);
  const scroller = useRef(null);

  // merge + sort asc
  const append = (rows) => {
    setMessages((prev) => {
      const map = new Map(prev.map((m) => [m.id, m]));
      for (const r of rows) map.set(r.id, r);
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      );
    });
  };

  // Imperative API for optimistic message
  useImperativeHandle(ref, () => ({
    appendTemp({ sender_id, content }) {
      const id = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const created_at = new Date().toISOString();
      const temp = { id, sender_id, content, created_at, _temp: true };
      setMessages((prev) => [...prev, temp]);
      // auto scroll
      queueMicrotask(() => {
        const el = scroller.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    },
  }));

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (!cancelled && !error && data) {
        // We’ll re-sort asc in append
        append(data);
      }
    }
    loadInitial();

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
        (payload) => {
          const real = payload.new;
          setMessages((prev) => {
            // find the last temp by same sender within 10s and replace it
            const cutoff = Date.now() - 10_000;
            let idx = -1;
            for (let i = prev.length - 1; i >= 0; i--) {
              const m = prev[i];
              if (
                m._temp &&
                m.sender_id === real.sender_id &&
                new Date(m.created_at).getTime() >= cutoff
              ) {
                idx = i;
                break;
              }
            }
            if (idx !== -1) {
              const clone = prev.slice();
              clone.splice(idx, 1, real);
              return clone.sort(
                (a, b) => new Date(a.created_at) - new Date(b.created_at)
              );
            }
            return [...prev, real].sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
          });
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const Avatar = ({ url, mine }) =>
    url ? (
      <img
        src={url}
        alt=""
        className={`h-6 w-6 rounded-full object-cover ${mine ? "order-2" : ""}`}
      />
    ) : (
      <div
        className={`h-6 w-6 rounded-full bg-muted ${mine ? "order-2" : ""}`}
      />
    );

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
        const ts = formatRelative(m.created_at);
        return (
          <div
            key={m.id}
            className={`flex items-end gap-2 ${
              mine ? "justify-end" : "justify-start"
            }`}
          >
            {!mine && <Avatar url={otherAvatarUrl} mine={false} />}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                mine
                  ? "ml-auto bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-white border rounded-bl-sm"
              }`}
              title={
                !m._temp ? new Date(m.created_at).toLocaleString() : "Sending…"
              }
            >
              <div
                className={`whitespace-pre-wrap break-words`}
                dangerouslySetInnerHTML={{ __html: escapeToHtml(m.content) }}
              />
              <div
                className={`mt-1 text-[10px] opacity-70 ${
                  mine ? "text-white/80" : ""
                }`}
              >
                {m._temp ? "Sending…" : ts}
              </div>
            </div>
            {mine && <Avatar url={meAvatarUrl} mine={true} />}
          </div>
        );
      })}
    </div>
  );
});

export default MessageList;
