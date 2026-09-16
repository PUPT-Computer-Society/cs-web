import React, { useRef, useState } from "react";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pencil,
  Quote,
  Sparkles,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { cn } from "@/lib/utils";

export interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  disabled?: boolean;
  rows?: number;
  id?: string;
  name?: string;
  className?: string;
  label?: string;
  required?: boolean;
  helperText?: string;
}

export const MarkdownTextarea: React.FC<MarkdownTextareaProps> = ({
  value,
  onChange,
  placeholder = "Write description using Markdown...",
  minHeight = "min-h-[90px]",
  maxHeight = "max-h-[320px]",
  disabled = false,
  rows = 3,
  id,
  name,
  className,
  label,
  required = false,
  helperText,
}) => {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const applyFormatting = (
    prefix: string,
    suffix: string = "",
    defaultPlaceholder: string = "",
  ) => {
    if (disabled || !textareaRef.current) return;
    const el = textareaRef.current;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.substring(start, end);

    const replacement = selected || defaultPlaceholder;
    const newValue =
      value.substring(0, start) +
      prefix +
      replacement +
      suffix +
      value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(
        start + prefix.length,
        start + prefix.length + replacement.length,
      );
    }, 0);
  };

  return (
    <div className={cn("space-y-1.5 w-full", className)}>
      {/* Header with Label and Mode Tabs */}
      <div className="flex items-center justify-between gap-2">
        {label ? (
          <label
            htmlFor={id}
            className="block text-[11px] font-semibold text-foreground select-none"
          >
            {label} {required && <span className="text-destructive">*</span>}
          </label>
        ) : (
          <div />
        )}

        <div className="flex items-center rounded-lg border border-border/70 bg-secondary/30 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
              activeTab === "write"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Pencil className="w-3 h-3" />
            <span>Write</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer",
              activeTab === "preview"
                ? "bg-card text-primary shadow-xs font-bold"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Eye className="w-3 h-3" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div className="rounded-lg border border-input bg-card/60 shadow-2xs overflow-hidden focus-within:ring-1 focus-within:ring-ring focus-within:border-ring transition-all">
        {/* Quick Markdown Toolbar (Visible in Write Mode) */}
        {activeTab === "write" && !disabled && (
          <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-border/50 bg-secondary/20 flex-wrap">
            <button
              type="button"
              onClick={() => applyFormatting("**", "**", "bold text")}
              title="Bold (**text**)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting("*", "*", "italic text")}
              title="Italic (*text*)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting("### ", "", "Heading 3")}
              title="Heading (### text)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <Heading2 className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-3.5 bg-border/60 mx-1" />

            <button
              type="button"
              onClick={() => applyFormatting("- ", "", "List item")}
              title="Bulleted List (- item)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting("1. ", "", "Ordered item")}
              title="Numbered List (1. item)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => applyFormatting("> ", "", "Quote text")}
              title="Blockquote (> quote)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <Quote className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-3.5 bg-border/60 mx-1" />

            <button
              type="button"
              onClick={() => applyFormatting("`", "`", "code")}
              title="Inline Code (`code`)"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() =>
                applyFormatting("[", "](https://example.com)", "link title")
              }
              title="Link ([title](url))"
              className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>

            <div className="ml-auto flex items-center gap-1 text-[10px] text-muted-foreground font-mono pr-1">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>Markdown</span>
            </div>
          </div>
        )}

        {/* Content Pane */}
        {activeTab === "write" ? (
          <textarea
            ref={textareaRef}
            id={id}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
            rows={rows}
            className={cn(
              "w-full px-3 py-2 text-base sm:text-xs bg-transparent " +
                "text-foreground placeholder:text-muted-foreground",
              "border-0 focus:outline-none focus:ring-0 resize-y",
              "overflow-y-auto leading-relaxed font-sans",
              minHeight,
              maxHeight,
              disabled && "opacity-50 cursor-not-allowed",
            )}
          />
        ) : (
          <div
            className={cn(
              "w-full px-3 py-2.5 text-xs bg-secondary/15 overflow-y-auto",
              minHeight,
              maxHeight,
            )}
          >
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-xs text-muted-foreground italic">
                Nothing to preview yet. Switch back to Write mode to add
                Markdown content.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Helper Footer */}
      {helperText && (
        <p className="text-[10px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
};
