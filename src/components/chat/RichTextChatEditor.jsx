"use client";

import { forwardRef, useImperativeHandle, useMemo } from "react";
import {
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { $generateHtmlFromNodes } from "@lexical/html";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getRoot,
  COMMAND_PRIORITY_LOW,
  KEY_DOWN_COMMAND,
} from "lexical";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { CodeNode } from "@lexical/code";
import EditorToolbar from "./EditorToolbar";

function Placeholder() {
  return (
    <div className="pointer-events-none absolute inset-0 p-3 text-sm text-muted-foreground">
      Write a message…
    </div>
  );
}

function HtmlExportHandle({ onReady }) {
  const [editor] = useLexicalComposerContext();
  useImperativeHandle(onReady, () => ({
    getHtml() {
      let html = "";
      editor.getEditorState().read(() => {
        html = $generateHtmlFromNodes(editor);
      });
      return html.trim();
    },
    clear() {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const p = $createParagraphNode();
        root.append(p);
        p.selectEnd();
      });
    },
  }));
  return null;
}

function KeySendPlugin({ onEnter }) {
  const [editor] = useLexicalComposerContext();
  // Enter to send; Shift+Enter makes newline
  editor.registerCommand(
    KEY_DOWN_COMMAND,
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        onEnter?.();
        return true;
      }
      return false;
    },
    COMMAND_PRIORITY_LOW
  );
  return null;
}

const theme = {
  paragraph: "my-0",
  text: { bold: "font-semibold", italic: "italic", underline: "underline" },
};

function onError(err) {
  console.error(err);
}

const RichTextChatEditor = forwardRef(function RichTextChatEditor(
  { onEnter },
  ref
) {
  const handleRef = useMemo(() => ({ current: null }), []);
  useImperativeHandle(ref, () => ({
    getHtml: () => handleRef.current?.getHtml(),
    clear: () => handleRef.current?.clear(),
  }));

  const initialConfig = {
    namespace: "lc-chat",
    theme,
    onError,
    nodes: [ListNode, ListItemNode, LinkNode, CodeNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="rounded-xl border bg-background">
        <EditorToolbar />
        <div className="relative">
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="min-h-24 max-h-40 overflow-y-auto p-3 text-sm outline-none" />
            }
            placeholder={<Placeholder />}
          />
          <HistoryPlugin />
          <OnChangePlugin onChange={() => {}} />
          <KeySendPlugin onEnter={onEnter} />
          <HtmlExportHandle onReady={handleRef} />
        </div>
      </div>
    </LexicalComposer>
  );
});

export default RichTextChatEditor;
