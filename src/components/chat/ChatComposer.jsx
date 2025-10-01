"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import MessageList from "./MessageList";
import { sendMessageAction } from "./actions";
import RichTextChatEditor from "./RichTextChatEditor";

export default function ChatComposer({
  sessionId,
  currentUserId,
  meAvatarUrl,
  otherAvatarUrl,
  emptyText,
}) {
  const listRef = useRef(null);
  const editorRef = useRef(null);

  async function handleSubmit(e) {
    if (e?.preventDefault) e.preventDefault();

    const html = (await editorRef.current?.getHtml()) || "";
    const plain = html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim();
    if (!plain) return;

    // optimistic bubble
    listRef.current?.appendTemp({ sender_id: currentUserId, content: html });

    // clear editor
    editorRef.current?.clear();

    // server action
    const fd = new FormData();
    fd.set("session_id", sessionId);
    fd.set("content", html);
    const res = await sendMessageAction(fd);
    if (res?.error) console.error("sendMessageAction error:", res.error);
  }

  return (
    <>
      <MessageList
        ref={listRef}
        sessionId={sessionId}
        currentUserId={currentUserId}
        emptyText={emptyText}
        meAvatarUrl={meAvatarUrl}
        otherAvatarUrl={otherAvatarUrl}
      />

      <form onSubmit={handleSubmit} className="space-y-2">
        <RichTextChatEditor ref={editorRef} onEnter={handleSubmit} />
        <div className="flex justify-end">
          <Button type="submit" className="h-10 rounded-xl">
            Send
          </Button>
        </div>
      </form>
    </>
  );
}
