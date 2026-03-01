"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogoMark } from "./LogoMark";
// import { supabase } from "../lib/supabase"; // Removed legacy Supabase

export interface VynthenSettings {
    personality: string;
    instructions: string;
    language: string;
    voice: string;
    depth: string;
    focus: string;
    duality: boolean;
}

const LANGUAGES = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "zh", label: "Mandarin Chinese", flag: "🇨🇳" },
    { code: "es", label: "Spanish", flag: "🇪🇸" },
    { code: "hi", label: "Hindi", flag: "🇮🇳" },
    { code: "ar", label: "Arabic", flag: "🇸🇦" },
    { code: "fr", label: "French", flag: "🇫🇷" },
    { code: "pt", label: "Portuguese", flag: "🇧🇷" },
    { code: "ru", label: "Russian", flag: "🇷🇺" },
    { code: "bn", label: "Bengali", flag: "🇧🇩" },
    { code: "ja", label: "Japanese", flag: "🇯🇵" },
    { code: "am", label: "Amharic", flag: "🇪🇹" },
    { code: "om", label: "Oromo", flag: "🇪🇹" },
    { code: "sw", label: "Swahili", flag: "🌍" },
    { code: "ha", label: "Hausa", flag: "🌍" },
    { code: "yo", label: "Yoruba", flag: "🌍" },
    { code: "de", label: "German", flag: "🇩🇪" },
    { code: "tr", label: "Turkish", flag: "🇹🇷" },
    { code: "ko", label: "Korean", flag: "🇰🇷" },
    { code: "it", label: "Italian", flag: "🇮🇹" },
    { code: "fa", label: "Persian (Farsi)", flag: "🇮🇷" },
    { code: "pa", label: "Punjabi", flag: "🇮🇳" },
    { code: "ur", label: "Urdu", flag: "🇵🇰" },
    { code: "vi", label: "Vietnamese", flag: "🇻🇳" },
    { code: "th", label: "Thai", flag: "🇹🇭" },
    { code: "tl", label: "Tagalog (Filipino)", flag: "🇵🇭" },
    { code: "ms", label: "Malay / Indonesian", flag: "🇲🇾" },
    { code: "nl", label: "Dutch", flag: "🇳🇱" },
    { code: "el", label: "Greek", flag: "🇬🇷" },
    { code: "so", label: "Somali", flag: "🇸🇴" },
    { code: "ti", label: "Tigrinya", flag: "🇪🇹" },
];

const PERSONALITIES = [
    { id: "balanced", label: "Balanced", desc: "Helpful and clear — default." },
    { id: "concise", label: "Concise", desc: "Short, direct answers. No fluff." },
    { id: "detailed", label: "Detailed", desc: "Thorough, well-explained." },
    { id: "creative", label: "Creative", desc: "Inventive, expressive." },
    { id: "formal", label: "Formal", desc: "Professional and structured." },
];

const VOICES = [
    { id: "casual", label: "Casual" },
    { id: "professional", label: "Professional" },
    { id: "enthusiastic", label: "Enthusiastic" },
    { id: "funny", label: "Funny" },
];

const DEPTHS = [
    { id: "precise", label: "Precise", desc: "Factual, conservative, strictly logical." },
    { id: "balanced", label: "Balanced", desc: "Standard creativity and reasoning." },
    { id: "creative", label: "Creative", desc: "Imaginative, broad connections." },
];

const FOCUS_MODES = [
    { id: "default", label: "Default", icon: "✦" },
    { id: "web", label: "Web", icon: "🌐" },
    { id: "code", label: "Code", icon: "⌨️" },
    { id: "writing", label: "Writing", icon: "✍️" },
    { id: "math", label: "Math", icon: "∑" },
    { id: "creative", label: "Creative", icon: "✶" },
];

const SETTINGS_KEY = "vynthen-settings";

const defaultSettings: VynthenSettings = {
    personality: "balanced",
    instructions: "",
    language: "en",
    voice: "casual",
    depth: "balanced",
    focus: "default",
    duality: false,
};

export function loadSettings(): VynthenSettings {
    if (typeof window === "undefined") return defaultSettings;
    try {
        const s = localStorage.getItem(SETTINGS_KEY);
        if (s) return { ...defaultSettings, ...JSON.parse(s) };
    } catch { /* ignore */ }
    return defaultSettings;
}

function saveSettings(s: VynthenSettings) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

type Tab = "general" | "personality" | "instructions" | "language";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSettingsChange?: (s: VynthenSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsChange }) => {
    const [tab, setTab] = useState<Tab>("general");
    const [settings, setSettings] = useState<VynthenSettings>(defaultSettings);
    const [langSearch, setLangSearch] = useState("");
    const [memories, setMemories] = useState<{ id: string; content: string; created_at: string }[]>([]);
    const [loadingMemories, setLoadingMemories] = useState(false);
    const backdropRef = useRef<HTMLDivElement>(null);

    const loadUserMemories = async () => {
        // TODO: Implement with Firebase if needed
        setMemories([]);
    };

    const deleteMemory = async (id: string) => {
        setMemories(prev => prev.filter(m => m.id !== id));
    };

    useEffect(() => {
        if (isOpen) {
            setSettings(loadSettings());
            loadUserMemories();
        }
    }, [isOpen]);

    const update = (patch: Partial<VynthenSettings>) => {
        setSettings(prev => {
            const next = { ...prev, ...patch };
            saveSettings(next);
            onSettingsChange?.(next);
            return next;
        });
    };

    const filteredLangs = LANGUAGES.filter(l =>
        l.label.toLowerCase().includes(langSearch.toLowerCase())
    );

    if (!isOpen) return null;

    const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
        {
            id: "general", label: "General", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
            )
        },
        {
            id: "personality", label: "Persona", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
            )
        },
        {
            id: "instructions", label: "Instructions", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>
            )
        },
        {
            id: "language", label: "Language", icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
            )
        },
        // {
        //     id: "memory", label: "Memory", icon: (
        //         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.5v3.75m0 0v3.75m0-3.75h3.75m-3.75 0H12m-9 6h18m-9 0v-9m0 9v9" /></svg>
        //     )
        // },
    ];

    return (
        <div
            ref={backdropRef}
            onMouseDown={(e) => { if (e.target === backdropRef.current) onClose(); }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-6"
        >
            <div className="w-full max-w-[760px] h-[600px] max-h-[90vh] rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg)] shadow-2xl overflow-hidden flex flex-col sm:flex-row animate-in fade-in zoom-in-95 duration-200">

                {/* Left Sidebar (Tabs) */}
                <div className="w-full sm:w-[220px] bg-[color:var(--vynthen-bg-secondary)] border-b sm:border-b-0 sm:border-r border-[color:var(--vynthen-border)] flex flex-col">
                    <div className="px-5 py-5 pb-2">
                        <h2 className="text-[16px] font-semibold text-[color:var(--vynthen-fg)]">Settings</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                        {tabs.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => setTab(t.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-colors ${tab === t.id
                                    ? "bg-[color:var(--vynthen-bg)] text-[color:var(--vynthen-fg)] shadow-sm border border-[color:var(--vynthen-border)]"
                                    : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg)]/50 hover:text-[color:var(--vynthen-fg)] border border-transparent"
                                    }`}
                            >
                                {t.icon}
                                {t.label}
                                {t.id === "language" && settings.language !== "en" && (
                                    <span className={`ml-auto w-1.5 h-1.5 rounded-full ${tab === t.id ? 'bg-[color:var(--vynthen-fg)]' : 'bg-[color:var(--vynthen-fg-muted)]'}`} />
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[color:var(--vynthen-bg)] relative">

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 btn-icon text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] bg-[color:var(--vynthen-bg-secondary)] hover:bg-[color:var(--vynthen-border)] rounded-full p-2 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="flex-1 overflow-y-auto px-8 py-8 custom-scrollbar">

                        {/* ── General ── */}
                        {tab === "general" && (
                            <div className="max-w-md space-y-8">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-[color:var(--vynthen-fg)] mb-1">Focus Mode</h3>
                                    <p className="text-[13px] text-[color:var(--vynthen-fg-muted)] mb-4">Set Vynthen's primary domain of expertise.</p>
                                    <div className="flex flex-wrap gap-2">
                                        {FOCUS_MODES.map(f => (
                                            <button key={f.id} type="button" onClick={() => update({ focus: f.id })}
                                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${settings.focus === f.id
                                                    ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] border-transparent shadow-sm"
                                                    : "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg-muted)] border-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)]"
                                                    }`}>
                                                <span>{f.icon}</span>{f.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-[color:var(--vynthen-border)] w-full" />

                                <div>
                                    <h3 className="text-[15px] font-semibold text-[color:var(--vynthen-fg)] mb-1">Voice Tone</h3>
                                    <p className="text-[13px] text-[color:var(--vynthen-fg-muted)] mb-4">How should Vynthen sound?</p>
                                    <div className="flex flex-wrap gap-2">
                                        {VOICES.map(v => (
                                            <button key={v.id} type="button" onClick={() => update({ voice: v.id })}
                                                className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors border ${settings.voice === v.id
                                                    ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] border-transparent shadow-sm"
                                                    : "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg-muted)] border-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)]"
                                                    }`}>
                                                {v.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-[color:var(--vynthen-border)] w-full" />

                                <div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="text-[15px] font-semibold text-[color:var(--vynthen-fg)] mb-1">Duality Mode</h3>
                                            <p className="text-[13px] text-[color:var(--vynthen-fg-muted)]">Generate two answers side-by-side: Polished + Raw.</p>
                                        </div>
                                        <button type="button" onClick={() => update({ duality: !settings.duality })}
                                            className={`relative w-11 h-6 rounded-full transition-colors ${settings.duality ? "bg-[color:var(--vynthen-fg)]" : "bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)]"}`}>
                                            <span className={`absolute top-[3px] w-4 h-4 rounded-full shadow transition-transform ${settings.duality ? "translate-x-6 bg-[color:var(--vynthen-bg)]" : "translate-x-1 bg-[color:var(--vynthen-fg-muted)]"}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Persona ── */}
                        {tab === "personality" && (
                            <div className="max-w-md space-y-8">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-[color:var(--vynthen-fg)] mb-1">Behavioral Depth</h3>
                                    <p className="text-[13px] text-[color:var(--vynthen-fg-muted)] mb-4">Adjust logic vs creativity.</p>
                                    <div className="space-y-2">
                                        {DEPTHS.map(d => (
                                            <button key={d.id} type="button" onClick={() => update({ depth: d.id })}
                                                className={`w-full flex items-start gap-3.5 rounded-xl px-4 py-3 text-left transition-colors border ${settings.depth === d.id
                                                    ? "border-[color:var(--vynthen-fg-muted)] bg-[color:var(--vynthen-bg-secondary)] shadow-sm"
                                                    : "border-transparent bg-[color:var(--vynthen-bg)] hover:bg-[color:var(--vynthen-bg-secondary)]"
                                                    }`}>
                                                <span className={`mt-0.5 flex h-4 w-4 flex-none rounded-full border-2 transition-colors ${settings.depth === d.id ? "border-[color:var(--vynthen-fg)] bg-[color:var(--vynthen-fg)]" : "border-[color:var(--vynthen-border)]"}`} />
                                                <div>
                                                    <div className="text-[14px] font-medium text-[color:var(--vynthen-fg)]">{d.label}</div>
                                                    <div className="text-[13px] text-[color:var(--vynthen-fg-muted)] mt-0.5">{d.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-px bg-[color:var(--vynthen-border)] w-full" />

                                <div>
                                    <h3 className="text-[15px] font-semibold text-[color:var(--vynthen-fg)] mb-1">Response Style</h3>
                                    <div className="space-y-2 mt-4">
                                        {PERSONALITIES.map(p => (
                                            <button key={p.id} type="button" onClick={() => update({ personality: p.id })}
                                                className={`w-full flex items-start gap-3.5 rounded-xl px-4 py-3 text-left transition-colors border ${settings.personality === p.id
                                                    ? "border-[color:var(--vynthen-fg-muted)] bg-[color:var(--vynthen-bg-secondary)] shadow-sm"
                                                    : "border-transparent bg-[color:var(--vynthen-bg)] hover:bg-[color:var(--vynthen-bg-secondary)]"
                                                    }`}>
                                                <span className={`mt-0.5 flex h-4 w-4 flex-none rounded-full border-2 transition-colors ${settings.personality === p.id ? "border-[color:var(--vynthen-fg)] bg-[color:var(--vynthen-fg)]" : "border-[color:var(--vynthen-border)]"}`} />
                                                <div>
                                                    <div className="text-[14px] font-medium text-[color:var(--vynthen-fg)]">{p.label}</div>
                                                    <div className="text-[13px] text-[color:var(--vynthen-fg-muted)] mt-0.5">{p.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Instructions ── */}
                        {tab === "instructions" && (
                            <div className="flex flex-col h-full max-w-xl">
                                <h3 className="text-[15px] font-semibold text-[color:var(--vynthen-fg)] mb-1">Custom Instructions</h3>
                                <p className="text-[13px] text-[color:var(--vynthen-fg-muted)] mb-4">
                                    Provide specific context or rules for Vynthen to follow in every response.
                                </p>
                                <textarea
                                    value={settings.instructions}
                                    onChange={e => update({ instructions: e.target.value })}
                                    placeholder="e.g. Always use bullet points. Focus on cybersecurity topics. Maintain a sarcastic tone."
                                    className="flex-1 w-full min-h-[300px] resize-none rounded-xl bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] p-4 text-[14px] leading-relaxed text-[color:var(--vynthen-fg)] placeholder:text-[color:var(--vynthen-fg-muted)] focus:outline-none focus:border-[color:var(--vynthen-fg-muted)] focus:ring-1 focus:ring-[color:var(--vynthen-fg-muted)] transition-all shadow-inner"
                                />
                                <div className="flex justify-end mt-2">
                                    <p className="text-[12px] text-[color:var(--vynthen-fg-muted)] font-mono">{settings.instructions.length}/2000 characters</p>
                                </div>
                            </div>
                        )}

                        {/* ── Translation ── */}
                        {tab === "language" && (
                            <div className="flex flex-col h-full max-w-md">
                                <h3 className="text-[15px] font-semibold text-[color:var(--vynthen-fg)] mb-1">Output Language</h3>
                                <p className="text-[13px] text-[color:var(--vynthen-fg-muted)] mb-4">
                                    Force Vynthen to respond in a specific language.
                                </p>
                                <div className="relative mb-4">
                                    <input
                                        type="text"
                                        placeholder="Search languages…"
                                        value={langSearch}
                                        onChange={e => setLangSearch(e.target.value)}
                                        className="w-full rounded-xl bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] px-4 py-3 text-[14px] text-[color:var(--vynthen-fg)] placeholder:text-[color:var(--vynthen-fg-muted)] focus:outline-none focus:border-[color:var(--vynthen-fg-muted)] focus:ring-1 focus:ring-[color:var(--vynthen-fg-muted)] pl-10 transition-all shadow-inner"
                                    />
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--vynthen-fg-muted)]">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                                    </svg>
                                </div>
                                <div className="space-y-1 overflow-y-auto pr-2 flex-1 custom-scrollbar">
                                    {filteredLangs.map(lang => (
                                        <button
                                            key={lang.code}
                                            type="button"
                                            onClick={() => update({ language: lang.code })}
                                            className={`w-full flex items-center gap-3.5 rounded-xl px-3 py-3 text-left transition-colors ${settings.language === lang.code
                                                ? "bg-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg)] font-medium shadow-sm"
                                                : "text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-bg-secondary)] hover:text-[color:var(--vynthen-fg)]"
                                                }`}
                                        >
                                            <span className="text-xl w-6 text-center leading-none">{lang.flag}</span>
                                            <span className="text-[14px]">{lang.label}</span>
                                            {settings.language === lang.code && (
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="ml-auto w-4 h-4 text-[color:var(--vynthen-fg)]">
                                                    <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                                </svg>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── Memory (Disabled) ── */}
                        {/* tab === "memory" && (...) */}

                    </div>
                </div>
            </div>
        </div>
    );
};
