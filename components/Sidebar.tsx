"use client";

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
  projects?: { id: string; name: string }[];
  activeProjectId?: string | null;
  onSelectProject?: (id: string | null) => void;
  onNewProject?: () => void;
}

// Reusable icon button with uniform 40×40 size
const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  label?: string;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, title, label, active, children, className = "" }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors
      ${active
        ? "bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg)]"
        : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)] hover:text-[color:var(--vynthen-fg)]"
      } ${className}`}
  >
    {children}
    {label && (
      <span className="ml-2 text-[13px] font-medium">{label}</span>
    )}
  </button>
);

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

      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 z-20 bg-black/40 backdrop-blur-sm sm:hidden"
          onClick={onToggleCollapsed}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-30 flex h-[100dvh] flex-col border-r border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] transition-all duration-300 ease-in-out ${collapsed ? "w-0 overflow-hidden sm:w-[64px]" : "w-[260px]"
          }`}
      >
        {/* ── TOP BAR ── */}
        <div className={`flex shrink-0 items-center gap-1 px-3 py-3 ${collapsed ? "flex-col px-[12px]" : ""}`}>

          {/* Hamburger / collapse */}
          <IconBtn onClick={onToggleCollapsed} title={collapsed ? "Expand" : "Collapse"}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          </IconBtn>

          {/* New Chat */}
          <IconBtn onClick={onNewChat} title="New Chat">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </IconBtn>

          {/* Library  (pushed to far right when expanded) */}
          {onToggleLibrary && !collapsed && (
            <button
              type="button"
              onClick={onToggleLibrary}
              title="Library"
              aria-label="Library"
              className="ml-auto flex h-9 items-center gap-1.5 rounded-xl border border-[color:var(--vynthen-border)] px-3 text-[13px] font-medium text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)] hover:text-[color:var(--vynthen-fg)] transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
              Library
            </button>
          )}
          {onToggleLibrary && collapsed && (
            <IconBtn onClick={onToggleLibrary} title="Library">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
              </svg>
            </IconBtn>
          )}
        </div>

        {/* ── VAULT / PROJECTS ── */}
        {projects.length > 0 && !collapsed && (
          <div className="shrink-0 px-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--vynthen-fg-muted)]">Vaults</span>
              {onNewProject && (
                <button
                  type="button"
                  onClick={onNewProject}
                  title="New Vault"
                  className="flex h-5 w-5 items-center justify-center rounded-md text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => onSelectProject?.(null)}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors whitespace-nowrap ${!activeProjectId
                  ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]"
                  : "border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]"
                  }`}
              >
                All Chats
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onSelectProject?.(p.id)}
                  className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors whitespace-nowrap ${activeProjectId === p.id
                    ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]"
                    : "border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]"
                    }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Divider */}
        {!collapsed && <div className="mx-3 h-px shrink-0 bg-[color:var(--vynthen-border)]" />}

        {/* ── CHAT LIST ── */}
        <div className={`flex-1 overflow-y-auto py-2 custom-scrollbar ${collapsed ? "px-[12px]" : "px-2"}`}>
          <nav className="space-y-0.5">
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;

              if (collapsed) {
                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    title={conv.title}
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition-colors ${isActive
                      ? "bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg)]"
                      : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)] hover:text-[color:var(--vynthen-fg)]"
                      }`}
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </button>
                );
              }

              return (
                <div
                  key={conv.id}
                  className={`group flex w-full items-center gap-1 rounded-lg px-2 py-1.5 transition-colors ${isActive
                    ? "bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg)]"
                    : "text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg)]/60"
                    }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className="flex-1 truncate text-left text-[14px] font-normal leading-5"
                  >
                    {conv.title}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => onDeleteConversation(conv.id)}
                    className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] transition-colors group-hover:flex"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}

            {conversations.length === 0 && !collapsed && (
              <p className="px-2 py-3 text-[13px] text-[color:var(--vynthen-fg-muted)]">No chats yet</p>
            )}
          </nav>
        </div>

        {/* ── BOTTOM BAR ── */}
        <div className="shrink-0 border-t border-[color:var(--vynthen-border)]">
          {collapsed ? (
            /* Collapsed bottom */
            <div className="flex flex-col items-center gap-1 py-3 px-[12px]">
              {/* Avatar → opens settings */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className="flex h-10 w-10 items-center justify-center rounded-xl hover:bg-[color:var(--vynthen-bg)] transition-colors"
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white ${isGuest ? "bg-[color:var(--vynthen-border)]" : "bg-bw-rainbow"}`}>
                  {isGuest ? "G" : (userEmail?.[0]?.toUpperCase() ?? "U")}
                </div>
              </button>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={onToggleTheme}
                title="Toggle theme"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)] hover:text-[color:var(--vynthen-fg)] transition-colors"
              >
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                )}
              </button>
            </div>
          ) : (
            /* Expanded bottom */
            <div className="flex items-center gap-1 p-3">
              {/* Profile + settings */}
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                title="Settings"
                className="flex flex-1 items-center gap-2.5 overflow-hidden rounded-xl p-2 text-left hover:bg-[color:var(--vynthen-bg)] transition-colors"
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${isGuest ? "bg-[color:var(--vynthen-border)]" : "bg-bw-rainbow"}`}>
                  {isGuest ? "G" : (userEmail?.[0]?.toUpperCase() ?? "U")}
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-[13px] font-medium text-[color:var(--vynthen-fg)]">
                    {isGuest ? "Guest" : (userEmail ?? "User")}
                  </p>
                  {isGuest && (
                    <p className="text-[11px] text-[color:var(--vynthen-fg-muted)]">Chats won&apos;t be saved</p>
                  )}
                </div>
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[color:var(--vynthen-fg-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.932 6.932 0 010 .255c-.008.378.137.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Theme */}
              <button
                type="button"
                onClick={onToggleTheme}
                title="Toggle theme"
                aria-label="Toggle theme"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)] hover:text-[color:var(--vynthen-fg)] transition-colors"
              >
                {theme === "dark" ? (
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
                )}
              </button>

              {/* Sign out / Sign in */}
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  title={isGuest ? "Sign in" : "Sign out"}
                  aria-label={isGuest ? "Sign in" : "Sign out"}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)] hover:text-[color:var(--vynthen-fg)] transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
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
