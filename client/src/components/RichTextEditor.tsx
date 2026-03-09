/**
 * RichTextEditor — Tiptap-based WYSIWYG editor with a STICKY toolbar.
 *
 * The toolbar uses `position: sticky; top: 0` so it stays visible as the
 * user types long content inside a scrollable parent container.
 *
 * Exports:
 *   default  RichTextEditor   — controlled editor (value / onChange)
 *   named    RichTextDisplay  — read-only HTML renderer
 */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useCallback } from "react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  List, ListOrdered, AlignLeft, AlignCenter, AlignRight,
  Link as LinkIcon, Undo, Redo, Heading2, Heading3, Quote,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  disabled?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ToolbarButton({ onClick, active, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      // Use onMouseDown + preventDefault to prevent editor blur on toolbar click
      onMouseDown={(e) => {
        e.preventDefault();
        if (!disabled) onClick();
      }}
      className={cn(
        "p-1.5 rounded transition-colors text-sm flex items-center justify-center",
        active ? "bg-[#189aa1] text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        disabled && "opacity-35 cursor-not-allowed pointer-events-none",
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 bg-gray-200 mx-0.5 self-center flex-shrink-0" />;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write here…",
  minHeight = "160px",
  className,
  disabled = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[#189aa1] underline cursor-pointer" },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    editable: !disabled,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  // Sync external value changes (e.g. form reset / loading draft)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const normalised = current === "<p></p>" ? "" : current;
    if (normalised !== value) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  // Sync editable flag
  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Enter URL (leave blank to remove):", prev);
    if (url === null) return; // cancelled
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-[#189aa1]/40 focus-within:border-[#189aa1] transition-all",
        disabled && "opacity-60 pointer-events-none bg-gray-50",
        className,
      )}
    >
      {/* ── Sticky toolbar ── */}
      {!disabled && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-white border-b border-gray-100 shadow-sm">
          {/* History */}
          <ToolbarButton title="Undo (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
            <Undo className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Redo (Ctrl+Shift+Z)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
            <Redo className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Sep />

          {/* Headings */}
          <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <Heading2 className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
            <Heading3 className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Sep />

          {/* Inline marks */}
          <ToolbarButton title="Bold (Ctrl+B)" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
            <Bold className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Italic (Ctrl+I)" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <Italic className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Underline (Ctrl+U)" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <UnderlineIcon className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <Strikethrough className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Sep />

          {/* Lists & blocks */}
          <ToolbarButton title="Bullet List" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <List className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Numbered List" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <ListOrdered className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <Quote className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Horizontal Rule" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
            <Minus className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Sep />

          {/* Alignment */}
          <ToolbarButton title="Align Left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <AlignLeft className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align Center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <AlignCenter className="w-3.5 h-3.5" />
          </ToolbarButton>
          <ToolbarButton title="Align Right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <AlignRight className="w-3.5 h-3.5" />
          </ToolbarButton>

          <Sep />

          {/* Link */}
          <ToolbarButton title="Insert / Edit Link" active={editor.isActive("link")} onClick={handleSetLink}>
            <LinkIcon className="w-3.5 h-3.5" />
          </ToolbarButton>
        </div>
      )}

      {/* ── Editor content area ── */}
      <EditorContent
        editor={editor}
        className="rte-content px-3 py-2.5 text-sm text-gray-800 focus:outline-none"
        style={{ minHeight }}
      />

      {/* ── Scoped styles ── */}
      <style>{`
        .rte-content .tiptap { outline: none; }
        .rte-content .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
        .rte-content .tiptap h2 { font-size: 1.05rem; font-weight: 700; margin: 0.6em 0 0.3em; color: #0e1e2e; }
        .rte-content .tiptap h3 { font-size: 0.95rem; font-weight: 600; margin: 0.5em 0 0.25em; color: #0e4a50; }
        .rte-content .tiptap ul { list-style: disc; padding-left: 1.4em; margin: 0.4em 0; }
        .rte-content .tiptap ol { list-style: decimal; padding-left: 1.4em; margin: 0.4em 0; }
        .rte-content .tiptap li { margin: 0.15em 0; }
        .rte-content .tiptap blockquote { border-left: 3px solid #189aa1; padding-left: 0.8em; color: #475569; font-style: italic; margin: 0.5em 0; }
        .rte-content .tiptap hr { border: none; border-top: 1px solid #e5e7eb; margin: 0.75em 0; }
        .rte-content .tiptap strong { font-weight: 700; }
        .rte-content .tiptap em { font-style: italic; }
        .rte-content .tiptap u { text-decoration: underline; }
        .rte-content .tiptap s { text-decoration: line-through; }
        .rte-content .tiptap p { margin: 0.3em 0; }
        .rte-content .tiptap a { color: #189aa1; text-decoration: underline; cursor: pointer; }
      `}</style>
    </div>
  );
}

// ─── Read-only display ────────────────────────────────────────────────────────

/**
 * RichTextDisplay — renders saved HTML from RichTextEditor in read-only mode.
 * Use wherever rich text content is displayed (case detail, admin preview, etc.)
 */
export function RichTextDisplay({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  if (!html) return null;
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none text-gray-700",
        "[&_h2]:text-base [&_h2]:font-bold [&_h2]:text-[#0e1e2e] [&_h2]:mt-3 [&_h2]:mb-1",
        "[&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-[#0e4a50] [&_h3]:mt-2 [&_h3]:mb-1",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
        "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
        "[&_li]:my-0.5",
        "[&_blockquote]:border-l-[3px] [&_blockquote]:border-[#189aa1] [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_blockquote]:my-2",
        "[&_hr]:border-t [&_hr]:border-gray-200 [&_hr]:my-2",
        "[&_strong]:font-bold",
        "[&_em]:italic",
        "[&_u]:underline",
        "[&_s]:line-through",
        "[&_a]:text-[#189aa1] [&_a]:underline",
        "[&_p]:my-1",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
