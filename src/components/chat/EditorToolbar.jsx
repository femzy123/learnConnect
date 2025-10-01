"use client";

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND } from "lexical";
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
} from "@lexical/list";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import {
  Bold,
  Italic,
  Underline,
  Link as LinkIcon,
  List as ListIcon,
  ListOrdered,
  Code,
} from "lucide-react";

const Btn = ({ onClick, title, children }) => (
  <button
    type="button"
    title={title}
    onClick={onClick}
    className="grid place-items-center h-7 w-7 rounded hover:bg-muted"
  >
    {children}
  </button>
);

export default function EditorToolbar() {
  const [editor] = useLexicalComposerContext();

  return (
    <div className="flex items-center gap-1 border-b px-2 py-1">
      <Btn title="Bold" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}>
        <Bold className="h-4 w-4" />
      </Btn>
      <Btn title="Italic" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}>
        <Italic className="h-4 w-4" />
      </Btn>
      <Btn title="Underline" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}>
        <Underline className="h-4 w-4" />
      </Btn>

      <span className="mx-1 h-4 w-px bg-border" />

      <Btn
        title="Link"
        onClick={() => {
          const url = window.prompt("Link URL") || "";
          editor.dispatchCommand(TOGGLE_LINK_COMMAND, url ? { url } : null);
        }}
      >
        <LinkIcon className="h-4 w-4" />
      </Btn>

      <span className="mx-1 h-4 w-px bg-border" />

      <Btn title="Bulleted list" onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND)}>
        <ListIcon className="h-4 w-4" />
      </Btn>
      <Btn title="Numbered list" onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND)}>
        <ListOrdered className="h-4 w-4" />
      </Btn>

      <span className="mx-1 h-4 w-px bg-border" />

      <Btn title="Code" onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}>
        <Code className="h-4 w-4" />
      </Btn>
    </div>
  );
}
