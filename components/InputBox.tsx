"use client";

import React, { useEffect, useRef, useState } from "react";

export type VoiceTone = "professional" | "casual" | "enthusiastic" | "funny";
export type DepthLevel = "precise" | "balanced" | "creative";
export type FocusMode = "default" | "web" | "code" | "writing" | "math" | "creative";
export type AtSkill = "none" | "code" | "write" | "research" | "analyze" | "coach";

const VOICE_PILLS: { id: VoiceTone; label: string }[] = [
  { id: "professional", label: "Professional" },
  { id: "casual", label: "Casual" },
  { id: "enthusiastic", label: "Enthusiastic" },
  { id: "funny", label: "Funny" },
];

const FOCUS_PILLS: { id: FocusMode; label: string; icon: string }[] = [
  { id: "default", label: "Default", icon: "✦" },
  { id: "web", label: "Web", icon: "🌐" },
  { id: "code", label: "Code", icon: "⌨️" },
  { id: "writing", label: "Writing", icon: "✍️" },
  { id: "math", label: "Math", icon: "∑" },
  { id: "creative", label: "Creative", icon: "✶" },
];

const AT_SKILLS: Record<string, AtSkill> = {
  "@code": "code", "@write": "write", "@research": "research",
  "@analyze": "analyze", "@coach": "coach",
};

export interface InputBoxProps {
  onSend: (value: string, isAgent: boolean, meta: InputMeta) => void;
  onEnterLiveMode?: () => void;
  onOpenIntegrations?: () => void;
}

export interface InputMeta {
  voice: VoiceTone;
  depth: DepthLevel;
  focus: FocusMode;
  skill: AtSkill;
  duality: boolean;
}

export const InputBox: React.FC<InputBoxProps> = ({ onSend, onEnterLiveMode, onOpenIntegrations }) => {
  const [value, setValue] = useState("");
  const [isAgentMode, setIsAgentMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Phase 1 UI state
  const [voice, setVoice] = useState<VoiceTone>("casual");
  const [depth, setDepth] = useState<DepthLevel>("balanced");
  const [focus, setFocus] = useState<FocusMode>("default");
  const [skill, setSkill] = useState<AtSkill>("none");
  const [duality, setDuality] = useState(false);
  const [showControls, setShowControls] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Auto-detect @skills in typed text
  useEffect(() => {
    const lower = value.toLowerCase();
    let detected: AtSkill = "none";
    for (const [mention, sk] of Object.entries(AT_SKILLS)) {
      if (lower.includes(mention)) { detected = sk; break; }
    }
    if (detected !== "none") setSkill(detected);
    else if (skill !== "none" && !Object.keys(AT_SKILLS).some(m => lower.includes(m))) {
      setSkill("none");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed, isAgentMode, { voice, depth, focus, skill, duality });
    setValue("");
    setSkill("none");
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const isEmpty = value.trim().length === 0;

  const activeControlCount = [
    voice !== "casual" ? 1 : 0,
    depth !== "balanced" ? 1 : 0,
    focus !== "default" ? 1 : 0,
    duality ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className={`relative rounded-[20px] bg-[color:var(--vynthen-bg-secondary)] transition-all duration-200 ${isAgentMode
        ? "border-bw-rainbow shadow-[0_0_20px_rgba(200,200,200,0.08)]"
        : "border border-[color:var(--vynthen-border)]"
      } shadow-sm`}>

      {/* Active badges row */}
      {(skill !== "none" || isAgentMode) && (
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-0 flex-wrap">
          {isAgentMode && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] bg-[color:var(--vynthen-bg)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--vynthen-fg-muted)]" />
              Agent Mode
            </span>
          )}
          {skill !== "none" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]">
              @{skill}
            </span>
          )}
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
        }}
        placeholder={
          skill !== "none" ? `@${skill} — what would you like?` :
            isAgentMode ? "Ask Agent to do something…" : "Message Vynthen…"
        }
        className="w-full resize-none bg-transparent px-4 pt-4 pb-2 text-[15px] leading-relaxed text-[color:var(--vynthen-fg)] placeholder:text-[color:var(--vynthen-fg-muted)] focus:outline-none focus-visible:outline-none max-h-[200px] min-h-[24px]"
        style={{ scrollbarWidth: "none", boxShadow: "none" }}
      />

      {/* Controls panel (Voice, Depth, Focus, Duality) */}
      {showControls && (
        <div className="px-4 pb-3 space-y-3 border-t border-[color:var(--vynthen-border)] pt-3 mt-1">

          {/* Voice */}
          <div>
            <p className="text-[10px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-widest mb-1.5">Voice</p>
            <div className="flex flex-wrap gap-1.5">
              {VOICE_PILLS.map(v => (
                <button key={v.id} type="button" onClick={() => setVoice(v.id)}
                  className={`px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${voice === v.id
                      ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] shadow-sm"
                      : "bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg-muted)] border border-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)]"
                    }`}>
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Depth */}
          <div>
            <p className="text-[10px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-widest mb-1.5">Depth</p>
            <div className="flex rounded-xl overflow-hidden border border-[color:var(--vynthen-border)] w-fit">
              {(["precise", "balanced", "creative"] as DepthLevel[]).map((d, i) => (
                <button key={d} type="button" onClick={() => setDepth(d)}
                  className={`px-4 py-1.5 text-[12px] font-medium capitalize transition-colors ${i > 0 ? "border-l border-[color:var(--vynthen-border)]" : ""
                    } ${depth === d ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]" : "text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]"}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Focus */}
          <div>
            <p className="text-[10px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-widest mb-1.5">Focus</p>
            <div className="flex flex-wrap gap-1.5">
              {FOCUS_PILLS.map(f => (
                <button key={f.id} type="button" onClick={() => setFocus(f.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-colors ${focus === f.id
                      ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] shadow-sm"
                      : "bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg-muted)] border border-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)]"
                    }`}>
                  <span>{f.icon}</span>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Duality */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-[color:var(--vynthen-fg)]">Duality Mode</p>
              <p className="text-[11px] text-[color:var(--vynthen-fg-muted)]">Two answers: Polished + Raw</p>
            </div>
            <button type="button" onClick={() => setDuality(v => !v)}
              className={`relative w-10 h-6 rounded-full transition-colors ${duality ? "bg-[color:var(--vynthen-fg)]" : "bg-[color:var(--vynthen-border)]"}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${duality ? "translate-x-5" : "translate-x-1"}`} />
            </button>
          </div>

        </div>
      )}

      {/* Bottom toolbar */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1">
        {/* Left: 3-dot menu + controls toggle */}
        <div className="flex items-center gap-1">
          <div className="relative" ref={menuRef}>
            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                <div className="absolute bottom-10 left-0 z-50 w-52 rounded-2xl bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] shadow-xl p-1.5">
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-widest">Mode</p>

                  <button type="button" onClick={() => { setIsAgentMode(false); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-colors ${!isAgentMode ? "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg)]" : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)]"}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${!isAgentMode ? "bg-[color:var(--vynthen-border)]" : "bg-transparent"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 006 21.75a6.721 6.721 0 003.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 01-.814 1.686.75.75 0 00.44 1.223zM8.25 10.875a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25zM10.875 12a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0zm4.875-1.125a1.125 1.125 0 100 2.25 1.125 1.125 0 000-2.25z" clipRule="evenodd" /></svg>
                    </div>
                    Chat
                    {!isAgentMode && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-auto text-[color:var(--vynthen-fg-muted)]"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>}
                  </button>

                  <button type="button" onClick={() => { setIsAgentMode(true); setIsMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium transition-colors ${isAgentMode ? "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg)] border border-[color:var(--vynthen-border)]" : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)]"}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${isAgentMode ? "bg-bw-rainbow text-[color:var(--vynthen-bg)]" : "bg-transparent"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" /><path d="M5.26 17.242a.75.75 0 10-.897-1.203 5.243 5.243 0 00-2.05 5.022.75.75 0 00.625.627 5.243 5.243 0 005.022-2.051.75.75 0 10-1.202-.897 3.744 3.744 0 01-3.008 1.51c0-1.23.592-2.323 1.51-3.008z" /></svg>
                    </div>
                    <span className={isAgentMode ? "font-semibold" : ""}>Agent Mode</span>
                    {isAgentMode && <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 ml-auto text-[color:var(--vynthen-fg-muted)]"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" /></svg>}
                  </button>

                  <div className="my-1 h-px bg-[color:var(--vynthen-border)]" />
                  <p className="px-3 py-1.5 text-[10px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-widest">Apps</p>

                  <button type="button" onClick={() => { setIsMenuOpen(false); onOpenIntegrations?.(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-medium text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)] transition-colors">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.641l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" /></svg>
                    </div>
                    Integrations
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 ml-auto text-[color:var(--vynthen-border)]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                  </button>
                </div>
              </>
            )}

            <button type="button" onClick={() => setIsMenuOpen(v => !v)} aria-label="More options"
              className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${isAgentMode ? "bg-bw-rainbow text-[color:var(--vynthen-bg)] shadow-sm" :
                  isMenuOpen ? "bg-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg)]" :
                    "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)]"
                }`}>
              {isAgentMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M9.315 7.584C12.195 3.883 16.695 1.5 21.75 1.5a.75.75 0 01.75.75c0 5.056-2.383 9.555-6.084 12.436A6.75 6.75 0 019.75 22.5a.75.75 0 01-.75-.75v-4.131A15.838 15.838 0 016.382 15H2.25a.75.75 0 01-.75-.75 6.75 6.75 0 017.815-6.666zM15 6.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" clipRule="evenodd" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <circle cx="4" cy="10" r="1.5" /><circle cx="10" cy="10" r="1.5" /><circle cx="16" cy="10" r="1.5" />
                </svg>
              )}
            </button>
          </div>

          {/* Controls toggle button — shows active indicator dot */}
          <button type="button" onClick={() => setShowControls(v => !v)} aria-label="Toggle controls"
            title="Voice · Depth · Focus · Duality"
            className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all ${showControls ? "bg-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg)]" :
                "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)]"
              }`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
            </svg>
            {activeControlCount > 0 && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[color:var(--vynthen-fg)]" />
            )}
          </button>
        </div>

        {/* Right: voice + send */}
        <div className="flex items-center gap-1">
          {isEmpty && (
            <button type="button" onClick={onEnterLiveMode} aria-label="Voice mode" title="Voice mode"
              className="flex h-8 w-8 items-center justify-center rounded-full text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)] transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            </button>
          )}
          <button type="button" aria-label="Send" onClick={handleSend} disabled={isEmpty}
            className={`flex h-8 w-8 flex-none items-center justify-center rounded-full transition-all shadow-sm ${isEmpty ? "bg-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] cursor-not-allowed" :
                "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] hover:opacity-80"
              }`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-3.5 w-3.5 pointer-events-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
