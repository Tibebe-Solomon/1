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
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);
  const [lensState, setLensState] = useState<{ isOpen: boolean; code: string; language: string }>({ isOpen: false, code: "", language: "" });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

  const handleOpenLens = (code: string, language: string) => {
    setLensState({ isOpen: true, code, language });
    if (!sidebarCollapsed) {
      onToggleSidebar();
    }
  };

  const isEmpty = messages.length === 0;

  return (
    <main
      className={`flex min-h-screen flex-col justify-center transition-all duration-300 bg-[color:var(--vynthen-bg)] ${sidebarCollapsed ? "sm:ml-[68px]" : "sm:ml-[260px]"}`}
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
            <div className={`flex-1 space-y-6 pb-6 pt-8 transition-all duration-300 ${lensState.isOpen ? 'sm:mr-[480px] lg:mr-[600px]' : ''}`}>
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} onSend={(t) => onSend(t)} onOpenLens={handleOpenLens} />
              ))}
              {isTyping && (
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
