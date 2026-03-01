import React, { useMemo, useState } from "react";
import type { Message } from "./types";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import { LogoMark } from "./LogoMark";
import { FalMediaRenderer } from "./FalMediaRenderer";

interface CodeBlockProps {
  language: string | undefined;
  value: string;
  children: React.ReactNode;
  onOpenLens?: (code: string, language: string) => void;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, value, children, onOpenLens }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }
    catch { /* ignore */ }
  };
  return (
    <div className="relative rounded-xl bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] my-4 text-[13px] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[color:var(--vynthen-border)]">
        <span className="text-xs font-mono text-[color:var(--vynthen-fg-muted)] lowercase">{language || "text"}</span>
        <div className="flex items-center gap-2">
          {onOpenLens && (language === "html" || language === "html/css") && (
            <button type="button" onClick={() => onOpenLens(value, language)} className="flex items-center gap-1.5 px-2 py-0.5 rounded text-xs text-[color:var(--vynthen-fg)] bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] hover:bg-[color:var(--vynthen-border)] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" /></svg>
              View in Lens
            </button>
          )}
          <button type="button" onClick={handleCopy} className="text-xs text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] transition-colors">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto"><pre><code className={language ? `language-${language}` : undefined}>{children}</code></pre></div>
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  onSend?: (text: string) => void;
  onOpenLens?: (code: string, language: string) => void;
}

const extractText = (node: any): string => {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (node?.props?.children) return extractText(node.props.children);
  return "";
};

const FAL_MEDIA_REGEX = /!\[([^\]]*)\]\((fal-(?:image|video):[^)]+)\)/g;
const SPARKS_REGEX = /```sparks\n([\s\S]*?)```/;

interface ContentSegment {
  type: "text" | "fal-media";
  content: string;
  alt?: string;
  src?: string;
}

function splitContentSegments(text: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  let lastIndex = 0;
  const regex = new RegExp(FAL_MEDIA_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    segments.push({ type: "fal-media", content: match[0], alt: match[1], src: match[2].trim() });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push({ type: "text", content: text.slice(lastIndex) });
  return segments;
}

/** Strip sparks block from display content and extract the 4 questions */
function extractSparks(content: string): { displayContent: string; sparks: string[] } {
  const match = SPARKS_REGEX.exec(content);
  if (!match) return { displayContent: content, sparks: [] };
  const sparks = match[1].split("\n").map(s => s.trim().replace(/^\[|\]$/g, "")).filter(Boolean).slice(0, 4);
  const displayContent = content.replace(match[0], "").trim();
  return { displayContent, sparks };
}

const RESHAPE_OPTIONS = [
  { id: "shorter", label: "↑ Shorter" },
  { id: "longer", label: "↓ Longer" },
  { id: "simpler", label: "◆ Simpler" },
  { id: "technical", label: "★ Technical" },
] as const;

const MarkdownContent: React.FC<{ text: string; message: Message; onOpenLens?: (code: string, language: string) => void }> = ({ text, message, onOpenLens }) => (
  <ReactMarkdown
    rehypePlugins={[rehypeHighlight]}
    components={{
      code(props) {
        const { children, className } = props;
        const match = /language-(\w+)/.exec(className || "");
        const value = extractText(children);
        const isInline = !match && !value.includes("\n");
        if (match?.[1] === "thinking" || (message.isAgent && value.includes("Step"))) {
          const steps = value.split("\n").filter(s => s.trim().length > 0);
          return (
            <div className="my-4 rounded-xl border-l-2 border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] px-4 py-3">
              <div className="flex items-center gap-2 mb-2.5">
                <span className="text-[11px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-wider">Agent Thinking</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex gap-2.5 text-[13px] text-[color:var(--vynthen-fg-muted)]">
                    <span className="font-mono text-[10px] mt-1 opacity-40">›</span>
                    <span className={idx === steps.length - 1 ? "text-[color:var(--vynthen-fg)]" : ""}>{step.replace(/^\[|\]$/g, "")}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (isInline) return <code className="rounded bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] px-1.5 py-0.5 text-[0.85em] font-mono text-[color:var(--vynthen-fg)]">{children}</code>;
        return <CodeBlock language={match?.[1]} value={value.replace(/\n$/, "")} onOpenLens={onOpenLens}>{children}</CodeBlock>;
      },
      img(props) {
        const { src, alt } = props;
        const safeSrc = src ? src.replace(/ /g, "%20") : "";
        if (safeSrc.endsWith(".mp4")) return <video src={safeSrc} controls autoPlay loop muted className="w-full max-w-sm rounded-2xl shadow-md border border-[color:var(--vynthen-border)] my-4 object-cover" />;
        return (
          <a href={safeSrc} target="_blank" rel="noopener noreferrer" className="block w-full max-w-sm my-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={safeSrc} alt={alt || "Image"} className="w-full h-auto rounded-2xl shadow-md border border-[color:var(--vynthen-border)]" loading="lazy" />
          </a>
        );
      }
    }}
  >
    {text}
  </ReactMarkdown>
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onSend, onOpenLens }) => {
  const isUser = message.sender === "user";
  const [reshaping, setReshaping] = useState(false);
  const [reshaped, setReshaped] = useState<string | null>(null);

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-in fade-in duration-200">
        <div className="max-w-[78%] rounded-2xl bg-[color:var(--vynthen-user-bubble)] px-5 py-3.5 text-[15px] leading-relaxed text-[color:var(--vynthen-fg)] shadow-sm">
          {message.content}
        </div>
      </div>
    );
  }

  const { displayContent, sparks } = useMemo(() => extractSparks(message.content), [message.content]);
  const displayText = reshaped || displayContent;
  const segments = useMemo(() => splitContentSegments(displayText), [displayText]);

  const handleReshape = async (style: string) => {
    if (!onSend || reshaping) return;
    setReshaping(true);
    try {
      const prompt = `Rewrite the following response to be ${style}. Return ONLY the rewritten response, nothing else:\n\n${displayContent}`;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] })
      });
      if (res.ok && res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          setReshaped(acc);
        }
      }
    } finally {
      setReshaping(false);
    }
  };

  return (
    <div className="flex items-start gap-3.5 mb-8 animate-in fade-in duration-300">
      <div className="flex h-6 w-6 flex-none items-center justify-center mt-0.5 text-[color:var(--vynthen-fg-muted)]">
        <LogoMark className="w-4 h-4" interactive={true} />
      </div>
      <div className="w-full max-w-none flex-1">
        <div className="prose-custom text-[15px]">
          {segments.map((seg, i) => {
            if (seg.type === "fal-media" && seg.src) {
              return <FalMediaRenderer key={i} src={seg.src} alt={seg.alt} messageId={message.id} />;
            }
            if (seg.content.trim()) return <MarkdownContent key={i} text={seg.content} message={message} onOpenLens={onOpenLens} />;
            return null;
          })}
        </div>

        {/* Reshape bar — only on complete messages */}
        {message.content.length > 50 && (
          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {RESHAPE_OPTIONS.map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleReshape(opt.id)}
                disabled={reshaping}
                className="px-3 py-1 rounded-full text-[11px] font-medium text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] transition-colors disabled:opacity-40"
              >
                {reshaping ? "…" : opt.label}
              </button>
            ))}
            {reshaped && (
              <button type="button" onClick={() => setReshaped(null)}
                className="px-3 py-1 rounded-full text-[11px] font-medium text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] transition-colors">
                ↺ Original
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                const folder = prompt("Library Folder Name (e.g. Code, Ideas, Misc):", "Uncategorized");
                if (folder) {
                  try {
                    const existing = JSON.parse(localStorage.getItem("vynthen-library") || "[]");
                    existing.push({ id: message.id + Date.now(), folder, content: displayContent, savedAt: Date.now() });
                    localStorage.setItem("vynthen-library", JSON.stringify(existing));
                    alert("Saved to Library!");
                  } catch (e) {
                    console.error("Failed to save to library", e);
                  }
                }
              }}
              className="ml-auto px-3 py-1 rounded-full text-[11px] font-medium text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] transition-colors flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
              Save
            </button>
          </div>
        )}

        {/* Sparks — 4 follow-up questions */}
        {sparks.length > 0 && onSend && (
          <div className="mt-4 flex flex-wrap gap-2">
            {sparks.map((spark, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSend(spark)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-medium text-[color:var(--vynthen-fg-muted)] bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)] hover:border-[color:var(--vynthen-fg-muted)] transition-colors text-left"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 shrink-0 opacity-50">
                  <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clipRule="evenodd" />
                </svg>
                {spark}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
