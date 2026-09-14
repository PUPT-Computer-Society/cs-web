import React from "react";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content?: string | null;
  className?: string;
}

/**
 * Lightweight, zero-dependency Markdown parser and renderer.
 * Formats headings, bold, italics, strikethrough, lists, blockquotes,
 * code blocks, inline code, and sanitized links with Tailwind styling.
 */
export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className,
}) => {
  if (!content || !content.trim()) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No description provided.
      </p>
    );
  }

  const renderFormattedLine = (line: string): React.ReactNode[] => {
    // Tokenize inline markdown: links, code, bold, italic, strikethrough
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    while (remaining.length > 0) {
      // Inline Code: `code`
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        tokens.push(
          <code
            key={`code-${keyIdx++}`}
            className="px-1.5 py-0.5 rounded bg-muted font-mono text-[11px] text-primary font-semibold border border-border/50"
          >
            {codeMatch[1]}
          </code>,
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Link: [text](url)
      const linkMatch = remaining.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/);
      if (linkMatch) {
        tokens.push(
          <a
            key={`link-${keyIdx++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary font-medium underline underline-offset-2 hover:text-primary/80 transition-colors"
          >
            {linkMatch[1]}
          </a>,
        );
        remaining = remaining.slice(linkMatch[0].length);
        continue;
      }

      // Bold: **text** or __text__
      const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
      if (boldMatch) {
        tokens.push(
          <strong key={`bold-${keyIdx++}`} className="font-bold text-foreground">
            {boldMatch[2]}
          </strong>,
        );
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Italic: *text* or _text_
      const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
      if (italicMatch && !italicMatch[2].startsWith(" ") && !italicMatch[2].endsWith(" ")) {
        tokens.push(
          <em key={`italic-${keyIdx++}`} className="italic">
            {italicMatch[2]}
          </em>,
        );
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // Strikethrough: ~~text~~
      const strikeMatch = remaining.match(/^~~(.*?)~~/);
      if (strikeMatch) {
        tokens.push(
          <del key={`del-${keyIdx++}`} className="line-through text-muted-foreground">
            {strikeMatch[1]}
          </del>,
        );
        remaining = remaining.slice(strikeMatch[0].length);
        continue;
      }

      // Plain text character run
      const nextSpecial = remaining.search(/[`*_[~]/);
      if (nextSpecial === -1) {
        tokens.push(remaining);
        break;
      } else if (nextSpecial === 0) {
        // Special character didn't match a rule, consume 1 char as plain text
        tokens.push(remaining[0]);
        remaining = remaining.slice(1);
      } else {
        tokens.push(remaining.slice(0, nextSpecial));
        remaining = remaining.slice(nextSpecial);
      }
    }

    return tokens;
  };

  // Split content into blocks
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (!line.trim()) {
      i++;
      continue;
    }

    // Fenced Code Block: ```lang
    if (line.trim().startsWith("```")) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <pre
          key={`codeblock-${i}`}
          className="p-3 my-2 rounded-lg bg-secondary/80 border border-border/80 overflow-x-auto text-[11px] font-mono text-foreground"
        >
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-base sm:text-lg font-bold text-foreground mt-3 mb-1 pb-1 border-b border-border/60"
        >
          {renderFormattedLine(line.slice(2))}
        </h1>,
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-sm sm:text-base font-bold text-foreground mt-2.5 mb-1"
        >
          {renderFormattedLine(line.slice(3))}
        </h2>,
      );
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-xs sm:text-sm font-bold text-foreground mt-2 mb-0.5"
        >
          {renderFormattedLine(line.slice(4))}
        </h3>,
      );
      i++;
      continue;
    }

    // Blockquote: > text
    if (line.startsWith("> ") || line === ">") {
      const quoteLines: string[] = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i] === ">")) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      elements.push(
        <blockquote
          key={`quote-${i}`}
          className="border-l-4 border-primary/50 pl-3 my-2 text-xs text-muted-foreground italic bg-secondary/20 py-1 rounded-r"
        >
          {quoteLines.map((ql, qIdx) => (
            <p key={`ql-${qIdx}`}>{renderFormattedLine(ql)}</p>
          ))}
        </blockquote>,
      );
      continue;
    }

    // Unordered List: - item or * item
    if (line.match(/^(\s*)[-*]\s+/)) {
      const listItems: { text: string; indent: number; isChecked?: boolean }[] = [];
      while (i < lines.length && lines[i].match(/^(\s*)[-*]\s+/)) {
        const itemMatch = lines[i].match(/^(\s*)[-*]\s+(.*)$/);
        if (itemMatch) {
          const indent = itemMatch[1].length;
          let text = itemMatch[2];
          let isChecked: boolean | undefined = undefined;

          if (text.startsWith("[x] ") || text.startsWith("[X] ")) {
            isChecked = true;
            text = text.slice(4);
          } else if (text.startsWith("[ ] ")) {
            isChecked = false;
            text = text.slice(4);
          }

          listItems.push({ text, indent, isChecked });
        }
        i++;
      }

      elements.push(
        <ul key={`ul-${i}`} className="space-y-1 my-1.5 pl-4 list-disc text-xs text-foreground">
          {listItems.map((item, liIdx) => (
            <li
              key={`li-${liIdx}`}
              className={cn(
                "leading-relaxed",
                item.isChecked !== undefined && "list-none flex items-center gap-1.5 -ml-4",
              )}
            >
              {item.isChecked !== undefined ? (
                <>
                  <input
                    type="checkbox"
                    checked={item.isChecked}
                    readOnly
                    className="rounded border-border w-3.5 h-3.5 text-primary focus:ring-0 cursor-default"
                  />
                  <span className={item.isChecked ? "line-through text-muted-foreground" : ""}>
                    {renderFormattedLine(item.text)}
                  </span>
                </>
              ) : (
                renderFormattedLine(item.text)
              )}
            </li>
          ))}
        </ul>,
      );
      continue;
    }

    // Numbered List: 1. item
    if (line.match(/^\d+\.\s+/)) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
        listItems.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-1 my-1.5 pl-5 list-decimal text-xs text-foreground">
          {listItems.map((text, liIdx) => (
            <li key={`oli-${liIdx}`} className="leading-relaxed">
              {renderFormattedLine(text)}
            </li>
          ))}
        </ol>,
      );
      continue;
    }

    // Regular Paragraph
    elements.push(
      <p key={`p-${i}`} className="text-xs text-foreground/90 leading-relaxed my-1">
        {renderFormattedLine(line)}
      </p>,
    );
    i++;
  }

  return (
    <div
      className={cn(
        "markdown-body text-xs text-foreground space-y-1 break-words select-text",
        className,
      )}
    >
      {elements}
    </div>
  );
};
