import React, { useState } from "react";
import type { Conversation } from "./types";
import { SettingsModal } from "./SettingsModal";
import type { VynthenSettings } from "./SettingsModal";

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
  onSettingsChange?: (s: VynthenSettings) => void;
  onToggleLibrary?: () => void;
  // Vault (Projects)
  projects?: { id: string; name: string }[];
  activeProjectId?: string | null;
  onSelectProject?: (id: string | null) => void;
  onNewProject?: () => void;
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
  onSettingsChange,
  onToggleLibrary,
  projects = [],
  activeProjectId = null,
  onSelectProject,
  onNewProject,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSettingsChange={onSettingsChange}
      />

      {/* Mobile overlay backdrop */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm sm:hidden transition-opacity duration-300"
          onClick={onToggleCollapsed}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed left-0 top-0 z-30 flex h-screen flex-col bg-[color:var(--vynthen-bg-secondary)] border-r border-[color:var(--vynthen-border)] transition-all duration-300 ${collapsed ? "w-0 sm:w-[68px] overflow-hidden" : "w-[260px]"
          }`}
      >
        {/* Top bar */}
        <div className={`flex items-center pt-3 pb-2 ${collapsed ? "flex-col gap-3 px-0 justify-start" : "justify-between px-3"}`}>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Toggle sidebar"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="btn-icon w-10 h-10 flex items-center justify-center shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </button>

          <button
            type="button"
            onClick={onNewChat}
            aria-label="New chat"
            title="New Chat"
            className="btn-icon w-10 h-10 flex items-center justify-center shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
              )}
            </svg>
          </button>

          {onToggleLibrary && (
            <button
              type="button"
              onClick={onToggleLibrary}
              aria-label="Library"
              title="Saved Library"
              className="btn-icon w-10 h-10 flex items-center justify-center shrink-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-[18px] w-[18px]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              {!collapsed && <span className="ml-3 text-[14px] font-medium hidden sm:block">Library</span>}
            </button>
          )}
        </div>

        {/* Projects (Vault) Area */}
        {projects.length > 0 && !collapsed && (
          <div className="px-3 pt-4 pb-2 border-b border-[color:var(--vynthen-border)] overflow-x-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] font-semibold tracking-wider text-[color:var(--vynthen-fg-muted)] uppercase">Vaults</span>
              {onNewProject && (
                <button onClick={onNewProject} className="text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectProject?.(null)}
                className={`py-1 px-2.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${!activeProjectId
                  ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]"
                  : "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] border border-[color:var(--vynthen-border)]"
                  }`}
              >
                All Chats
              </button>
              {projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject?.(p.id)}
                  className={`py-1 px-2.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${activeProjectId === p.id
                    ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]"
                    : "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] border border-[color:var(--vynthen-border)]"
                    }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className={`flex-1 overflow-y-auto py-4 ${collapsed ? "px-2" : "px-3"}`}>
          <nav className="space-y-1">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;

              if (collapsed) {
                // Icon-only view for chats (using a simple message bubble icon)
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    title={conv.title}
                    className={`w-10 h-10 mx-auto flex items-center justify-center rounded-xl transition-colors ${isActive
                      ? "bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg)] border border-[color:var(--vynthen-border)] shadow-sm"
                      : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)]/50 hover:text-[color:var(--vynthen-fg)]"
                      }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </button>
                );
              }

              // Full expanded view
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
                    title="Delete chat"
                    onClick={() => onDeleteConversation(conv.id)}
                    className="ml-1 hidden h-6 w-6 items-center justify-center rounded-md text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)] transition-colors group-hover:flex"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              );
            })}
            {conversations.length === 0 && !collapsed && (
              <div className="px-3 py-2 text-[13px] text-[color:var(--vynthen-fg-muted)]">
                No recent chats
              </div>
            )}
          </nav>
        </div>

        {/* Bottom Profile Area */}
        <div className="mt-auto border-t border-[color:var(--vynthen-border)]">
          {collapsed ? (
            // Collapsed Bottom Area
            <div className="flex flex-col items-center gap-3 py-4">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[color:var(--vynthen-bg)] transition-colors"
              >
                <div className={`flex w-[26px] h-[26px] items-center justify-center rounded-full text-[10px] font-bold text-white ${isGuest ? 'bg-[color:var(--vynthen-border)]' : 'bg-bw-rainbow'}`}>
                  {isGuest ? 'G' : (userEmail?.[0]?.toUpperCase() ?? 'U')}
                </div>
              </button>

              <button
                type="button"
                onClick={onToggleTheme}
                title="Toggle Theme"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg)] transition-colors"
              >
                {theme === "dark" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                )}
              </button>
            </div>
          ) : (
            // Expanded Bottom Area
            <div className="flex items-center gap-2 p-3">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className="flex-1 flex items-center gap-2.5 p-2 rounded-xl hover:bg-[color:var(--vynthen-bg)] transition-colors overflow-hidden text-left"
              >
                <div className={`flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-bold text-white ${isGuest ? 'bg-[color:var(--vynthen-border)]' : 'bg-bw-rainbow'}`}>
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
                {/* Settings gear icon */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[color:var(--vynthen-fg-muted)] shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.932 6.932 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

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
          )}
        </div>
      </aside>
    </>
  );
};
