"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sidebar } from "../components/Sidebar";
import { ChatArea } from "../components/ChatArea";
import { AuthScreen } from "../components/AuthScreen";
import { OnboardingScreen } from "../components/OnboardingScreen";
import type { Conversation, Message } from "../components/types";
import { useVynthen } from "../context/VynthenContext";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { loadSettings } from "../components/SettingsModal";
import type { VynthenSettings } from "../components/SettingsModal";
import type { InputMeta } from "../components/InputBox";

type AppState = "loading" | "auth" | "onboarding" | "app";

export default function HomePage() {
  const { theme, setTheme } = useVynthen();
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isSurfing, setIsSurfing] = useState(false);
  const [appState, setAppState] = useState<AppState>("loading");
  const [user, setUser] = useState<User | null>(null);
  const [connectedIntegrations, setConnectedIntegrations] = useState<string[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [settings, setSettings] = useState<VynthenSettings>({ personality: "balanced", instructions: "", language: "en", voice: "casual", depth: "balanced", focus: "default", duality: false });

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const isGuest = user === null && appState === "app";

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
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("[Auth] State changed:", firebaseUser?.email || "No user");
      if (firebaseUser) {
        setUser(firebaseUser);
        setAppState("loading"); // Show loading while checking profile/conversations

        try {
          const profileSnap = await getDoc(doc(db, "profiles", firebaseUser.uid));
          if (!profileSnap.exists()) {
            console.log("[Auth] Profile not found, redirecting to onboarding");
            setAppState("onboarding");
          } else {
            console.log("[Auth] Profile found, loading conversations");
            await loadConversations(firebaseUser.uid);
            setAppState("app");
          }
        } catch (err) {
          console.error("[Auth Error] Profile check failed:", err);
          await loadConversations(firebaseUser.uid);
          setAppState("app");
        }
      } else {
        setUser(null);
        setConversations([]);
        setActiveId(null);
        setAppState("auth");
      }
    });
    return () => unsub();
  }, []);

  // ── Load conversations from Firestore ──────────────────────────────────────
  const loadConversations = async (userId: string) => {
    try {
      // 1. Fetch Projects
      const projSnap = await getDocs(
        query(collection(db, "projects"), where("userId", "==", userId), orderBy("createdAt", "desc"))
      );
      const projData = projSnap.docs.map((d) => ({ id: d.id, name: d.data().name as string }));
      setProjects(projData);

      // 2. Fetch Conversations
      const convSnap = await getDocs(
        query(collection(db, "conversations"), where("userId", "==", userId), orderBy("createdAt", "desc"))
      );

      // 3. Fetch all messages for this user's conversations
      const msgSnap = await getDocs(
        query(collection(db, "messages"), where("userId", "==", userId), orderBy("createdAt", "asc"))
      );

      const messages = msgSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as Array<{
        id: string; conversationId: string; sender: "user" | "vynthen"; content: string; createdAt: { toDate: () => Date } | null;
      }>;

      const loaded: Conversation[] = convSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          title: data.title as string,
          projectId: data.projectId ?? undefined,
          messages: messages
            .filter((m) => m.conversationId === d.id)
            .map((m) => ({
              id: m.id,
              sender: m.sender,
              content: m.content,
              createdAt: m.createdAt?.toDate() ?? new Date(),
            })),
        };
      });

      setConversations(loaded);
      if (loaded.length > 0) setActiveId(loaded[0].id);
    } catch (err) {
      console.error("[Firestore Error] Failed to load data:", err);
    }
  };

  const handleAuthSuccess = () => {
    // onAuthStateChanged fires automatically — nothing extra needed
  };

  const handleGuestMode = () => {
    setUser(null);
    setConversations([]);
    setActiveId(null);
    setAppState("app");
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setConversations([]);
    setActiveId(null);
    setAppState("auth");
  };

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  // ── Core send ──────────────────────────────────────────────────────────────
  const handleSend = async (text: string, isAgent?: boolean, meta?: InputMeta) => {
    let convId = activeId;
    let baseMessages: Message[] = activeConversation?.messages ?? [];

    if (!convId) {
      if (!isGuest) {
        const insertData: Record<string, unknown> = {
          title: text.slice(0, 60) || "New chat",
          userId: user!.uid,
          createdAt: serverTimestamp(),
        };
        if (activeProjectId) insertData.projectId = activeProjectId;
        const newConvRef = await addDoc(collection(db, "conversations"), insertData);
        const local: Conversation = { id: newConvRef.id, title: text.slice(0, 60) || "New chat", messages: [] };
        setConversations((prev) => [local, ...prev]);
        setActiveId(newConvRef.id);
        convId = newConvRef.id;
      } else {
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
      const userMsgRef = await addDoc(collection(db, "messages"), {
        conversationId: convId,
        userId: user!.uid,
        sender: "user",
        content: text,
        createdAt: serverTimestamp(),
      });
      userMsg = { id: userMsgRef.id, sender: "user", content: text, createdAt: new Date() };
    } else {
      userMsg = { id: `${Date.now()}-u`, sender: "user", content: text, createdAt: new Date() };
    }

    const messagesWithUser = [...baseMessages, userMsg];
    let replyId = `${Date.now()}-a`;

    if (!isGuest && !convId!.startsWith("guest-")) {
      const aiMsgRef = await addDoc(collection(db, "messages"), {
        conversationId: convId,
        userId: user!.uid,
        sender: "vynthen",
        content: "",
        createdAt: serverTimestamp(),
      });
      replyId = aiMsgRef.id;
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

    // ── Web Surf ──────────────────────────────────────────────────────────────
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
          webSearchContext = `\n\nWEB SEARCH RESULTS (from Tavily, use these to inform your answer):\n${searchData.answer ? `Summary: ${searchData.answer}\n\n` : ""}${sourceLines}\nIMPORTANT: Base your answer on these results. Cite sources with [1], [2], etc.`;
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
          echo: false,
          userId: isGuest ? undefined : user?.uid,
        }),
      });

      if (!res.ok || !res.body) {
        const errContent = `Error: ${await res.text().catch(() => "Unknown")}`;
        if (!isGuest && !convId!.startsWith("guest-")) {
          await updateDoc(doc(db, "messages", replyId), { content: errContent });
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

      if (!isGuest && !convId!.startsWith("guest-")) {
        await updateDoc(doc(db, "messages", replyId), { content: accumulated });
        if (baseMessages.length === 0) {
          await updateDoc(doc(db, "conversations", convId!), { title: text.slice(0, 60) });
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
      const newConvRef = await addDoc(collection(db, "conversations"), {
        title: "New chat",
        userId: user!.uid,
        createdAt: serverTimestamp(),
      });
      setConversations((prev) => [{ id: newConvRef.id, title: "New chat", messages: [] }, ...prev]);
      setActiveId(newConvRef.id);
    } else {
      const id = `guest-${Date.now()}`;
      setConversations((prev) => [{ id, title: "New chat", messages: [] }, ...prev]);
      setActiveId(id);
    }
    setIsTyping(false);
  }, [isGuest, user]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    if (!isGuest && !id.startsWith("guest-")) {
      await deleteDoc(doc(db, "conversations", id));
    }
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) {
      const remaining = conversationsRef.current.filter((c) => c.id !== id);
      setActiveId(remaining[0]?.id ?? null);
    }
  }, [activeId, isGuest]);

  const handleVoiceQuery = useCallback(async (text: string): Promise<string> => {
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

  // ── Render States ─────────────────────────────────────────────────────────
  if (appState === "loading") {
    return (
      <div data-theme={theme} className="min-h-[100dvh] flex items-center justify-center bg-[color:var(--vynthen-bg)]">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce" />
            <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce [animation-delay:0.3s]" />
          </div>
          <p className="text-xs text-[color:var(--vynthen-fg-muted)] font-medium animate-pulse">
            Getting things ready...
          </p>
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

  if (appState === "onboarding") {
    if (!user) {
      setAppState("auth");
      return null;
    }
    return (
      <div data-theme={theme}>
        <OnboardingScreen
          userId={user.uid}
          userEmail={user.email ?? ""}
          onComplete={() => {
            console.log("[Onboarding] Completed, loading app...");
            setAppState("loading");
            loadConversations(user.uid).then(() => setAppState("app"));
          }}
        />
      </div>
    );
  }

  const handleNewProject = async () => {
    if (isGuest || !user) {
      alert("Sign in to create a Vault.");
      return;
    }
    const name = prompt("Name for new Vault:");
    if (!name?.trim()) return;

    const projRef = await addDoc(collection(db, "projects"), {
      userId: user.uid,
      name,
      createdAt: serverTimestamp(),
    });

    setProjects(prev => [{ id: projRef.id, name }, ...prev]);
    setActiveProjectId(projRef.id);
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
        userEmail={user?.email ?? undefined}
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
        userId={user?.uid ?? null}
        onConnectionsChanged={setConnectedIntegrations}
        isLibraryOpen={isLibraryOpen}
        onCloseLibrary={() => setIsLibraryOpen(false)}
        isSurfing={isSurfing}
      />
    </div>
  );
}
