import React from "react";
import type { Conversation } from "./types";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onDeleteConversation: (id: string) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  isGuest?: boolean;
  userEmail?: string;
  onSignOut?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  collapsed,
  onToggleCollapsed,
  onDeleteConversation,
  theme,
  onToggleTheme,
  isGuest,
  userEmail,
  onSignOut,
}) => {
  if (collapsed) {
    return (
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[0px] flex-col items-center justify-between bg-[color:var(--vynthen-bg-secondary)] border-r border-[color:var(--vynthen-border)] sm:flex transition-all duration-300">
        {/* Completely hidden on desktop when collapsed in new claude layout */}
      </aside>
    );
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm sm:hidden transition-opacity"
        onClick={onToggleCollapsed}
        aria-hidden="true"
      />
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-[260px] flex-col bg-[color:var(--vynthen-bg-secondary)] border-r border-[color:var(--vynthen-border)] transition-transform duration-300">
        <div className="flex items-center justify-between px-3 pt-3 pb-2">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            className="btn-icon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            className="btn-icon"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <nav className="space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              return (
                <div
                  key={conv.id}
                  className={`group flex w-full items-center rounded-lg px-2.5 py-2 text-[14px] transition-colors ${isActive ? "bg-[color:var(--vynthen-bg)] font-medium text-[color:var(--vynthen-fg)]" : "hover:bg-[color:var(--vynthen-bg)]/50 text-[color:var(--vynthen-fg)]"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className="flex-1 truncate text-left"
                  >
                    <span>{conv.title}</span>
                  </button>
                  <button
                    type="button"
                    aria-label="Delete chat"
                    onClick={() => onDeleteConversation(conv.id)}
                    className="ml-1 hidden h-6 w-6 items-center justify-center rounded-md text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)] transition-colors group-hover:flex"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              );
            })}
            {conversations.length === 0 && (
              <div className="px-3 py-2 text-[13px] text-[color:var(--vynthen-fg-muted)]">
                No recent chats
              </div>
            )}
          </nav>
        </div>

        <div className="mt-auto border-t border-[color:var(--vynthen-border)]">
          <div className="flex items-center gap-2 p-3">
            <div className="flex-1 flex items-center gap-2.5 p-2 rounded-xl hover:bg-[color:var(--vynthen-bg)] transition-colors overflow-hidden">
              <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white ${isGuest ? 'bg-[color:var(--vynthen-border)]' : 'bg-gradient-to-tr from-purple-500 to-blue-500'}`}>
                {isGuest ? 'G' : (userEmail?.[0]?.toUpperCase() ?? 'U')}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="truncate text-sm font-medium text-[color:var(--vynthen-fg)]">
                  {isGuest ? 'Guest' : (userEmail ?? 'User')}
                </div>
                {isGuest && (
                  <div className="text-[11px] text-[color:var(--vynthen-fg-muted)]">Chats won't be saved</div>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="btn-icon p-2 hover:bg-[color:var(--vynthen-bg)] rounded-md transition-colors shrink-0"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
              )}
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                title={isGuest ? 'Sign in' : 'Sign out'}
                className="btn-icon p-2 hover:bg-[color:var(--vynthen-bg)] rounded-md transition-colors shrink-0"
                aria-label={isGuest ? 'Sign in' : 'Sign out'}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
