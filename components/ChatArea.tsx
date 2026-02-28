import React, { useEffect, useRef, useState } from "react";
import type { Message } from "./types";
import { MessageBubble } from "./MessageBubble";
import { WelcomeScreen } from "./WelcomeScreen";
import { InputBox } from "./InputBox";
import { LiveVoiceMode } from "./LiveVoiceMode";
import { IntegrationsPanel } from "./IntegrationsPanel";

interface ChatAreaProps {
  messages: Message[];
  isTyping: boolean;
  onSend: (text: string, isAgent?: boolean) => void;
  onSuggestionClick: (prompt: string) => void;
  theme: "dark" | "light";
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onSendVoiceQuery?: (text: string) => Promise<string>;
  userId?: string | null;
  onConnectionsChanged?: (connectedIds: string[]) => void;
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
}) => {
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isIntegrationsOpen, setIsIntegrationsOpen] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, isTyping]);

  const isEmpty = messages.length === 0;

  return (
    <main
      className={`flex min-h-screen justify-center transition-all duration-200 bg-[color:var(--vynthen-bg)] ${sidebarCollapsed ? "sm:ml-[0px]" : "sm:ml-[260px]"
        }`}
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

      <div className="flex w-full max-w-3xl flex-col px-4 pb-6 pt-4 sm:px-8 sm:pt-6">
        {/* Header - Minimalist */}
        <div className="mb-6 flex items-center justify-between">
          <div className="absolute sm:fixed top-4 left-4 z-10 flex items-center gap-2">
            {!sidebarCollapsed ? null : (
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
            )}
          </div>
        </div>

        {/* Messages / Centered Layout */}
        <div className="relative flex min-h-[70vh] flex-1 flex-col justify-end">
          <div className="mx-auto flex w-full max-w-[700px] flex-1 flex-col justify-end">
            <div className={`flex-1 space-y-6 ${isEmpty ? 'hidden' : 'block mb-6'}`}>
              {messages.map((message) => (
                <div key={message.id}>
                  <MessageBubble message={message} />
                </div>
              ))}
              {isTyping && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[13px] text-[color:var(--vynthen-fg-muted)] flex items-center gap-1">
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

            <div className={`transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)] w-full ${isEmpty ? 'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : 'relative mt-auto sticky bottom-6'}`}>
              {isEmpty && (
                <div className="mb-8">
                  <WelcomeScreen onSuggestionClick={onSuggestionClick} />
                </div>
              )}
              <InputBox
                onSend={(text, isAgent) => onSend(text, isAgent)}
                onEnterLiveMode={() => setIsLiveMode(true)}
                onOpenIntegrations={() => setIsIntegrationsOpen(true)}
              />
              <div className="mt-2 text-center text-xs text-[color:var(--vynthen-fg-muted)]">
                Vynthen can make mistakes. Please verify important information.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main >
  );
};
