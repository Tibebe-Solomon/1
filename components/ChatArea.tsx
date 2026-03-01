import React, { useEffect, useRef, useState } from "react";
import type { Message } from "./types";
import { MessageBubble } from "./MessageBubble";
import { WelcomeScreen } from "./WelcomeScreen";
import { InputBox } from "./InputBox";
import type { InputMeta } from "./InputBox";
import { LiveVoiceMode } from "./LiveVoiceMode";
import { IntegrationsPanel } from "./IntegrationsPanel";
import { Lens } from "./Lens";
import { Library } from "./Library";

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onSend: (text: string, isAgent?: boolean, meta?: InputMeta) => void;
  onSuggestionClick: (prompt: string) => void;
  theme: "dark" | "light";
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSendVoiceQuery?: (text: string) => Promise<string>;
  userId?: string | null;
  onConnectionsChanged?: (connectedIds: string[]) => void;
  isLibraryOpen: boolean;
  onCloseLibrary: () => void;
  isSurfing?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isTyping,
  onSend,
  onSuggestionClick,
  theme,
  sidebarCollapsed,
  onToggleSidebar,
  onSendVoiceQuery,
  userId,
  onConnectionsChanged,
  isLibraryOpen,
  onCloseLibrary,
  isSurfing = false,
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [lensState, setLensState] = useState<{ isOpen: boolean; code: string; language: string }>({ isOpen: false, code: "", language: "" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping, isSurfing]);

  const handleOpenLens = (code: string, language: string) => {
    setLensState({ isOpen: true, code, language });
    if (!sidebarCollapsed) {
      onToggleSidebar();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <main
      className={`flex min-h-[100dvh] flex-col justify-center transition-all duration-300 bg-[color:var(--vynthen-bg)] ${sidebarCollapsed ? "sm:ml-[68px]" : "sm:ml-[260px]"}`}
    >
      {isLiveMode && onSendVoiceQuery && (
        <LiveVoiceMode
          onClose={() => setIsLiveMode(false)}
          onSendVoiceQuery={onSendVoiceQuery}
        />
      )}

      <IntegrationsPanel
        isOpen={isIntegrationsOpen}
        onClose={() => setIsIntegrationsOpen(false)}
        userId={userId ?? null}
        onConnectionsChanged={onConnectionsChanged ?? (() => { })}
      />

      <Library
        isOpen={isLibraryOpen}
        onClose={onCloseLibrary}
      />

      <Lens
        isOpen={lensState.isOpen}
        onClose={() => setLensState(prev => ({ ...prev, isOpen: false }))}
        code={lensState.code}
        language={lensState.language}
      />

      {/* Sidebar toggle — fixed top-left */}
      {sidebarCollapsed && (
        <div className="fixed top-3 left-3 z-10">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="btn-icon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex w-full flex-1 flex-col items-center px-4 pb-6 pt-4 sm:px-8">
        <div className="flex w-full max-w-[700px] flex-1 flex-col">

          {/* Messages */}
          {!isEmpty && (
            <div className="flex-1 space-y-6 pb-6 pt-8 transition-all duration-300">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} onSend={(t) => onSend(t)} onOpenLens={handleOpenLens} />
              ))}
              {isSurfing && (
                <div className="flex items-start gap-3.5 mb-4 animate-in fade-in duration-300">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center mt-0.5">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-blue-400 animate-spin" style={{ animationDuration: '2s' }}>
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[13px] font-medium text-blue-400 flex items-center gap-1.5">
                      Surfing the web
                      <span className="flex gap-0.5">
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce" />
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                        <span className="w-1 h-1 bg-blue-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                      </span>
                    </span>
                    <span className="text-[11px] text-[color:var(--vynthen-fg-muted)]">Searching the web for real-time information…</span>
                  </div>
                </div>
              )}
              {isTyping && !isSurfing && (
                <div className="flex items-center gap-2 mt-2 mb-2">
                  <span className="text-[13px] text-[color:var(--vynthen-fg-muted)] flex items-center gap-1.5">
                    Vynthen is thinking
                    <span className="flex gap-0.5 ml-1">
                      <span className="w-1 h-1 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce" />
                      <span className="w-1 h-1 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1 h-1 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </span>
                  </span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Welcome + Input — always at the bottom, welcome fades in/out */}
          <div className={`w-full transition-all duration-300 ${lensState.isOpen ? 'sm:pr-[480px] lg:pr-[600px]' : ''} ${isEmpty ? "flex flex-1 flex-col justify-center" : "mt-auto sticky bottom-6"}`}>
            {isEmpty && (
              <div className="mb-8 animate-in fade-in duration-300">
                <WelcomeScreen onSuggestionClick={onSuggestionClick} />
              </div>
            )}
            <InputBox
              onSend={(text, isAgent, meta) => onSend(text, isAgent, meta)}
              onEnterLiveMode={() => setIsLiveMode(true)}
              onOpenIntegrations={() => setIsIntegrationsOpen(true)}
            />
            <div className="mt-2 text-center text-xs text-[color:var(--vynthen-fg-muted)]">
              Vynthen can make mistakes. Please verify important information.
            </div>
          </div>

        </div>
      </div>
    </main>
  );
};
