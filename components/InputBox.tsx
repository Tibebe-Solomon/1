"use client";

import React, { useEffect, useRef, useState } from "react";

interface InputBoxProps {
  onSend: (value: string, isAgent: boolean) => void;
  onEnterLiveMode?: () => void;
  onOpenIntegrations?: () => void;
}

export const InputBox: React.FC<InputBoxProps> = ({ onSend, onEnterLiveMode, onOpenIntegrations }) => {
  const [value, setValue] = useState("");
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed, isAgentMode);
    setValue("");
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const isEmpty = value.trim().length === 0;

  return (
    <div className={`relative rounded-[20px] bg-[color:var(--vynthen-bg-secondary)] border transition-all duration-200 ${isAgentMode
      ? "border-purple-500/40 shadow-[0_0_20px_rgba(168,85,247,0.12)]"
      : "border-[color:var(--vynthen-border)]"
      } shadow-sm`}>

      {/* Agent mode badge */}
      {isAgentMode && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
            Agent Mode
          </span>
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
          }
        }}
        placeholder={isAgentMode ? "Ask Agent to do something…" : "Message Vynthen…"}
        className="w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[15px] leading-relaxed text-[color:var(--vynthen-fg)] placeholder:text-[color:var(--vynthen-fg-muted)] focus-visible:outline-none max-h-[200px] min-h-[24px]"
        style={{ scrollbarWidth: "none" }}
      />

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        {/* Left: 3-dot menu */}
        <div className="relative" ref={menuRef}>
          {isMenuOpen && (
            <>
              {/* Backdrop */}
              <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />

              {/* Menu popup */}
              <div className="absolute bottom-10 left-0 z-50 w-52 rounded-2xl bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] shadow-2xl p-1.5 animate-in slide-in-from-bottom-2 fade-in duration-150">
                <p className="px-3 py-1.5 text-[10px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-widest">Mode</p>

                {/* Chat */}
                <button
                  type="button"
                  onClick={() => { setIsAgentMode(false); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-colors ${!isAgentMode
                    ? "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg)]"
                    : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)]"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${!isAgentMode ? "bg-[color:var(--vynthen-border)]" : "bg-transparent"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Chat
                  {!isAgentMode && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-auto text-[color:var(--vynthen-fg-muted)]"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>}
                </button>

                {/* Agent */}
                <button
                  type="button"
                  onClick={() => { setIsAgentMode(true); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-colors ${isAgentMode
                    ? "bg-purple-500/10 text-purple-400"
                    : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)]"
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isAgentMode ? "bg-purple-500/20" : "bg-transparent"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
                      <path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" />
                    </svg>
                  </div>
                  Agent Mode
                  {isAgentMode && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-auto text-purple-400"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>}
                </button>

                {/* Integrations divider */}
                <div className="my-1 h-px bg-[color:var(--vynthen-border)]" />
                <p className="px-3 py-1.5 text-[10px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-widest">Apps</p>

                {/* Integrations */}
                <button
                  type="button"
                  onClick={() => { setIsMenuOpen(false); onOpenIntegrations?.(); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.641l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Integrations
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 ml-auto text-[color:var(--vynthen-border)]">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            </>
          )}

          {/* 3-dot trigger button */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="More options"
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${isAgentMode
              ? "bg-gradient-to-tr from-purple-500 to-blue-500 text-white shadow-sm"
              : isMenuOpen
                ? "bg-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg)]"
                : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)]"
              }`}
          >
            {isAgentMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <circle cx="4" cy="10" r="1.5" />
                <circle cx="10" cy="10" r="1.5" />
                <circle cx="16" cy="10" r="1.5" />
              </svg>
            )}
          </button>
        </div>

        {/* Right: voice + send */}
        <div className="flex items-center gap-1">
          {isEmpty && (
            <button
              type="button"
              onClick={onEnterLiveMode}
              aria-label="Voice mode"
              title="Voice mode"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)] transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          )}

          <button
            type="button"
            aria-label="Send"
            onClick={handleSend}
            disabled={isEmpty}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition-all shadow-sm ${isEmpty
              ? "bg-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] cursor-not-allowed"
              : "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] hover:opacity-80"
              }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
