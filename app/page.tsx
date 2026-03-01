"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { ChatArea } from "../components/ChatArea";
import { AuthScreen } from "../components/AuthScreen";
import type { Conversation, Message } from "../components/types";
import { useVynthen } from "../context/VynthenContext";
import { supabase } from "../lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { loadSettings } from "../components/SettingsModal";
import type { VynthenSettings } from "../components/SettingsModal";
import type { InputMeta } from "../components/InputBox";

type AppState = "loading" | "auth" | "app";

export default function HomePage() {
  const { theme, setTheme } = useVynthen();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSurfing, setIsSurfing] = useState(false);
  const [appState, setAppState] = useState<AppState>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [settings, setSettings] = useState<VynthenSettings>({ personality: "balanced", instructions: "", language: "en", voice: "casual", depth: "balanced", focus: "default", duality: false });

  // Vault state
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const isGuest = session === null && appState === "app";

  // Load settings on mount
  useEffect(() => { setSettings(loadSettings()); }, []);

  const conversationsRef = useRef(conversations);
  useEffect(() => { conversationsRef.current = conversations; }, [conversations]);

  // ── Theme persistence ──────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTheme = window.localStorage.getItem("vynthen-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      setTheme(storedTheme as "light" | "dark");
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("vynthen-theme", theme);
  }, [theme]);

  // ── Auth state listener ────────────────────────────────────────────────────
  useEffect(() => {
    // Check existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        loadConversations(data.session.user.id);
      } else {
        setAppState("auth");
      }
    });

    // Subscribe to future auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (!sess) {
        setConversations([]);
        setActiveId(null);
        setAppState("auth");
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // ── Load conversations from Supabase (authenticated user only) ─────────────
  const loadConversations = async (userId: string) => {
    // 1. Fetch Projects (Vault)
    const { data: projData } = await supabase
      .from("projects")
      .select("id, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setProjects(projData ?? []);

    // 2. Fetch Conversations
    const { data: convData } = await supabase
      .from("conversations")
      .select("id, title, project_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const { data: msgData } = await supabase
      .from("messages")
      .select("id, conversation_id, sender, content, created_at")
      .order("created_at", { ascending: true });

    const messages = msgData ?? [];
    const loaded: Conversation[] = (convData ?? []).map((c) => ({
      id: c.id,
      title: c.title,
      projectId: c.project_id ?? undefined,
      messages: messages
        .filter((m) => m.conversation_id === c.id)
        .map((m) => ({
          id: m.id,
          sender: m.sender as "user" | "vynthen",
          content: m.content,
          createdAt: new Date(m.created_at),
        })),
    }));

    setConversations(loaded);
    if (loaded.length > 0) setActiveId(loaded[0].id);
    setAppState("app");
  };

  const handleAuthSuccess = () => {
    // onAuthStateChange will fire and loadConversations will be called
    // we just ensure the UI is ready to show the app
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setSession(data.session);
        loadConversations(data.session.user.id);
      }
    });
  };

  const handleGuestMode = () => {
    setSession(null);
    setConversations([]);
    setActiveId(null);
    setAppState("app");
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setConversations([]);
    setActiveId(null);
    setAppState("auth");
  };

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // ── Core send: DB-backed (logged in) OR in-memory (guest) ─────────────────
  const handleSend = async (text: string, isAgent?: boolean, meta?: InputMeta) => {
    let convId = activeId;
    let baseMessages: Message[] = activeConversation?.messages ?? [];

    if (!convId) {
      if (!isGuest) {
        // Authenticated: persisted conversation
        const insertData: any = { title: text.slice(0, 60) || "New chat", user_id: session!.user.id };
        if (activeProjectId) {
          insertData.project_id = activeProjectId;
        }

        const { data: newConv, error } = await supabase
          .from("conversations")
          .insert(insertData)
          .select()
          .single();
        if (error || !newConv) { console.error(error); return; }

        const local: Conversation = { id: newConv.id, title: newConv.title, messages: [] };
        setConversations((prev) => [local, ...prev]);
        setActiveId(newConv.id);
        convId = newConv.id;
      } else {
        // Guest: in-memory only
        const id = `guest-${Date.now()}`;
        const local: Conversation = { id, title: text.slice(0, 60) || "New chat", messages: [] };
        setConversations((prev) => [local, ...prev]);
        setActiveId(id);
        convId = id;
        baseMessages = [];
      }
    }

    let userMsg: Message;

    if (!isGuest && !convId!.startsWith("guest-")) {
      const { data: userMsgDb, error } = await supabase
        .from("messages")
        .insert({ conversation_id: convId, sender: "user", content: text })
        .select().single();
      if (error || !userMsgDb) { console.error(error); return; }
      userMsg = { id: userMsgDb.id, sender: "user", content: text, createdAt: new Date(userMsgDb.created_at) };
    } else {
      userMsg = { id: `${Date.now()}-u`, sender: "user", content: text, createdAt: new Date() };
    }

    const messagesWithUser = [...baseMessages, userMsg];
    let replyId = `${Date.now()}-a`;

    if (!isGuest && !convId!.startsWith("guest-")) {
      const { data: aiMsgDb, error } = await supabase
        .from("messages")
        .insert({ conversation_id: convId, sender: "vynthen", content: "" })
        .select().single();
      if (error || !aiMsgDb) { console.error(error); return; }
      replyId = aiMsgDb.id;
    }

    setConversations((prev) =>
      prev.map((c) => c.id !== convId ? c : {
        ...c, messages: [
          ...messagesWithUser,
          { id: replyId, sender: "vynthen" as const, content: "", createdAt: new Date(), isAgent }
        ]
      })
    );
    setIsTyping(true);

    // ── Web Surf: search Tavily before asking the AI ──────────────────────────
    let webSearchContext = "";
    if (meta?.webSearch) {
      setIsSurfing(true);
      try {
        const searchRes = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: text }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const sourceLines = (searchData.sources ?? []).map(
            (s: { title: string; url: string; snippet: string }, i: number) =>
              `[${i + 1}] ${s.title}\nURL: ${s.url}\nSnippet: ${s.snippet}`
          ).join("\n\n");
          webSearchContext = `\n\nWEB SEARCH RESULTS (from Tavily, use these to inform your answer):\n${searchData.answer ? `Summary: ${searchData.answer}\n\n` : ""}${sourceLines}\nIMPORTANT: Base your answer on these results. Cite sources with [1], [2], etc. at relevant points.`;
        }
      } catch (e) {
        console.error("Web search failed:", e);
      } finally {
        setIsSurfing(false);
      }
    }

    const history = messagesWithUser.map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    try {
      const chatMessages = webSearchContext
        ? history.map((m, i) => i === history.length - 1 && m.role === "user"
          ? { ...m, content: m.content + webSearchContext }
          : m)
        : history;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatMessages,
          isAgent,
          personality: settings.personality,
          instructions: settings.instructions,
          language: settings.language,
          voice: settings.voice ?? "casual",
          depth: settings.depth ?? "balanced",
          focus: settings.focus ?? "default",
          skill: meta?.skill ?? "none",
          duality: settings.duality ?? false,
          echo: false, // Echo is a separate opt-in feature, never auto-activate
          userId: isGuest ? undefined : session?.user?.id,
        }),
      });

      if (!res.ok || !res.body) {
        const errContent = `Error: ${await res.text().catch(() => "Unknown")}`;
        if (!isGuest && !convId!.startsWith("guest-")) {
          await supabase.from("messages").update({ content: errContent }).eq("id", replyId);
        }
        setConversations((prev) =>
          prev.map((c) => c.id !== convId ? c : {
            ...c, messages: c.messages.map((m) => m.id === replyId ? { ...m, content: errContent } : m)
          })
        );
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setConversations((prev) =>
          prev.map((c) => c.id !== convId ? c : {
            ...c, messages: c.messages.map((m) =>
              m.id === replyId ? { ...m, content: accumulated } : m
            )
          })
        );
      }

      // Persist final AI response (only for logged-in users)
      if (!isGuest && !convId!.startsWith("guest-")) {
        await supabase.from("messages").update({ content: accumulated }).eq("id", replyId);
        if (baseMessages.length === 0) {
          await supabase.from("conversations").update({ title: text.slice(0, 60) }).eq("id", convId);
        }
      }

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setConversations((prev) =>
        prev.map((c) => c.id !== convId ? c : {
          ...c, messages: c.messages.map((m) =>
            m.id === replyId ? { ...m, content: `Error: ${msg}` } : m
          )
        })
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleNewChat = useCallback(async () => {
    if (!isGuest) {
      const { data: newConv, error } = await supabase
        .from("conversations")
        .insert({ title: "New chat", user_id: session!.user.id })
        .select().single();
      if (error || !newConv) return;
      setConversations((prev) => [{ id: newConv.id, title: "New chat", messages: [] }, ...prev]);
      setActiveId(newConv.id);
    } else {
      const id = `guest-${Date.now()}`;
      setConversations((prev) => [{ id, title: "New chat", messages: [] }, ...prev]);
      setActiveId(id);
    }
    setIsTyping(false);
  }, [isGuest, session]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!isGuest && !id.startsWith("guest-")) {
      await supabase.from("conversations").delete().eq("id", id);
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversationsRef.current.filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  }, [activeId, isGuest]);

  const handleVoiceQuery = useCallback(async (text: string): Promise<string> => {
    // Simplified: just call the API, don't persist for voice (guest or auth — conversation already handled by handleSend)
    const history = (activeConversation?.messages ?? []).map((m) => ({
      role: m.sender === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));
    history.push({ role: "user", content: text });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok) return "Sorry, I encountered an error.";
      const reader = res.body?.getReader();
      if (!reader) return "Sorry, I encountered an error.";
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
      }
      return accumulated;
    } catch {
      return "Sorry, I encountered an error.";
    }
  }, [activeConversation]);

  const filteredConversations = useMemo(() => {
    if (!activeProjectId) return conversations;
    return conversations.filter(c => c.projectId === activeProjectId);
  }, [conversations, activeProjectId]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (appState === "loading") {
    return (
      <div data-theme={theme} className="min-h-[100dvh] flex items-center justify-center bg-[color:var(--vynthen-bg)]">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce" />
          <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce [animation-delay:0.15s]" />
          <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce [animation-delay:0.3s]" />
        </div>
      </div>
    );
  }

  if (appState === "auth") {
    return (
      <div data-theme={theme}>
        <AuthScreen onAuthSuccess={handleAuthSuccess} onGuestMode={handleGuestMode} />
      </div>
    );
  }

  const handleNewProject = async () => {
    if (isGuest || !session) {
      alert("Sign in to create a Vault.");
      return;
    }
    const name = prompt("Name for new Vault:");
    if (!name?.trim()) return;

    const { data, error } = await supabase
      .from("projects")
      .insert({ user_id: session.user.id, name })
      .select("id, name")
      .single();

    if (error) {
      console.error(error);
      alert("Failed to create vault.");
      return;
    }

    if (data) {
      setProjects(prev => [data, ...prev]);
      setActiveProjectId(data.id);
    }
  };

  return (
    <div data-theme={theme} className="min-h-[100dvh] bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg)]">
      <Sidebar
        conversations={filteredConversations}
        activeId={activeId}
        onSelectConversation={(id) => { setActiveId(id); setIsTyping(false); }}
        onNewChat={handleNewChat}
        collapsed={sidebarCollapsed}
        onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        onDeleteConversation={handleDeleteConversation}
        theme={theme}
        onToggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        isGuest={isGuest}
        onSignOut={handleSignOut}
        userEmail={session?.user?.email}
        onSettingsChange={setSettings}
        onToggleLibrary={() => setIsLibraryOpen(true)}
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={(id) => { setActiveProjectId(id); setActiveId(null); }}
        onNewProject={handleNewProject}
      />
      <ChatArea
        messages={activeConversation?.messages ?? []}
        isTyping={isTyping}
        onSend={handleSend}
        onSuggestionClick={handleSend}
        theme={theme}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((v) => !v)}
        onSendVoiceQuery={handleVoiceQuery}
        userId={session?.user?.id ?? null}
        onConnectionsChanged={setConnectedIntegrations}
        isLibraryOpen={isLibraryOpen}
        onCloseLibrary={() => setIsLibraryOpen(false)}
        isSurfing={isSurfing}
      />
    </div>
  );
}
