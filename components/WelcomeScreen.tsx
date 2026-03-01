import React from "react";

interface WelcomeScreenProps {
  onSuggestionClick: (prompt: string) => void;
}

const SUGGESTIONS = [
  { label: "Write", prompt: "Help me write a professional email to my team about an upcoming project deadline." },
  { label: "Code", prompt: "Write a Python function that fetches and parses JSON from a URL." },
  { label: "Explain", prompt: "Explain how large language models work in simple terms." },
  { label: "Create", prompt: "Generate a creative short story set in a futuristic underwater city." },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center text-center pb-6">
      <div className="space-y-2 mb-10">
        <h1 className="text-[1.6rem] sm:text-[2rem] font-semibold tracking-tight text-[color:var(--vynthen-fg)]">
          How can I help you today?
        </h1>
        <p className="text-sm text-[color:var(--vynthen-fg-muted)]">
          Ask anything. Keep it simple, or go deep.
        </p>
      </div>

      {/* Suggestion chips */}
      <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm">
        {SUGGESTIONS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSuggestionClick(s.prompt)}
            className="flex flex-col items-start gap-0.5 rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] px-4 py-3 text-left transition-colors hover:border-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)] cursor-pointer"
          >
            <span className="text-[13.5px] font-medium text-[color:var(--vynthen-fg)]">{s.label}</span>
            <span className="text-[12px] text-[color:var(--vynthen-fg-muted)] line-clamp-2 leading-snug">
              {s.prompt.slice(0, 60)}…
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
