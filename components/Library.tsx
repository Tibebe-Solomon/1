"use client";

import React, { useState, useEffect } from "react";

export interface SavedItem {
    id: string;
    folder: string;
    content: string;
    savedAt: number;
}

interface LibraryProps {
    isOpen: boolean;
    onClose: () => void;
}

const PREVIEW_LIMIT = 500; // chars before showing Expand button

const BookmarkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
    </svg>
);

export const Library: React.FC<LibraryProps> = ({ isOpen, onClose }) => {
    const [items, setItems] = useState<SavedItem[]>([]);
    const [activeFolder, setActiveFolder] = useState<string>("All");
    const [expandedItem, setExpandedItem] = useState<SavedItem | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            try {
                const stored = localStorage.getItem("vynthen-library");
                if (stored) setItems(JSON.parse(stored));
            } catch { /* ignore */ }
        }
    }, [isOpen]);

    const folders = ["All", ...Array.from(new Set(items.map(item => item.folder)))];

    const deleteItem = (id: string) => {
        const next = items.filter(item => item.id !== id);
        setItems(next);
        localStorage.setItem("vynthen-library", JSON.stringify(next));
        if (expandedItem?.id === id) setExpandedItem(null);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch { /* ignore */ }
    };

    const filteredItems = activeFolder === "All"
        ? items
        : items.filter(i => i.folder === activeFolder);

    if (!isOpen) return null;

    return (
        <>
            {/* ── FULL-RESPONSE MODAL ── */}
            {expandedItem && (
                <div
                    className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
                    onClick={() => setExpandedItem(null)}
                >
                    <div
                        className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] rounded-2xl shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vynthen-border)] shrink-0">
                            <div className="flex items-center gap-2">
                                <BookmarkIcon />
                                <span className="text-[15px] font-semibold text-[color:var(--vynthen-fg)]">{expandedItem.folder}</span>
                                <span className="text-[11px] text-[color:var(--vynthen-fg-muted)] ml-1">
                                    {new Date(expandedItem.savedAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(expandedItem.content)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg-secondary)] transition-colors"
                                >
                                    {copied ? (
                                        <>
                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                                            Copy
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setExpandedItem(null)}
                                    className="flex h-8 w-8 items-center justify-center rounded-xl text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg-secondary)] transition-colors"
                                >
                                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Modal body */}
                        <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
                            <p className="text-[14px] text-[color:var(--vynthen-fg)] leading-relaxed whitespace-pre-wrap">
                                {expandedItem.content}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── LIBRARY PANEL ── */}
            <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none transition-all">
                <div className="absolute inset-0 sm:hidden" onClick={onClose} />

                <div className="w-full sm:w-[420px] h-full bg-[color:var(--vynthen-bg)] border-l border-[color:var(--vynthen-border)] shadow-2xl flex flex-col relative z-10">

                    {/* Header */}
                    <div className="flex shrink-0 items-center justify-between px-5 py-4 border-b border-[color:var(--vynthen-border)]">
                        <div className="flex items-center gap-2 text-[color:var(--vynthen-fg)]">
                            <BookmarkIcon />
                            <h2 className="text-[16px] font-semibold">Library</h2>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-8 w-8 items-center justify-center rounded-xl text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg-secondary)] transition-colors"
                        >
                            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>

                    {/* Folder tabs */}
                    {items.length > 0 && (
                        <div className="flex shrink-0 gap-2 px-4 py-3 overflow-x-auto border-b border-[color:var(--vynthen-border)] custom-scrollbar">
                            {folders.map(folder => (
                                <button
                                    key={folder}
                                    type="button"
                                    onClick={() => setActiveFolder(folder)}
                                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${activeFolder === folder
                                        ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]"
                                        : "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] border border-[color:var(--vynthen-border)]"
                                        }`}
                                >
                                    {folder}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Item list */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                                <BookmarkIcon />
                                <p className="text-[14px] font-medium text-[color:var(--vynthen-fg)] mt-4">Your Library is empty</p>
                                <p className="text-[13px] text-[color:var(--vynthen-fg-muted)] mt-1 max-w-[200px]">Save important AI responses to find them easily later.</p>
                            </div>
                        ) : (
                            filteredItems.map(item => {
                                const isLong = item.content.length > PREVIEW_LIMIT;
                                const preview = isLong ? item.content.slice(0, PREVIEW_LIMIT) : item.content;

                                return (
                                    <div
                                        key={item.id}
                                        className="group rounded-xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] p-4 transition-colors hover:border-[color:var(--vynthen-fg-muted)]"
                                    >
                                        {/* Card header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--vynthen-fg-muted)] bg-[color:var(--vynthen-border)] px-2 py-0.5 rounded">
                                                {item.folder}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => deleteItem(item.id)}
                                                className="opacity-0 group-hover:opacity-100 text-[color:var(--vynthen-fg-muted)] hover:text-red-500 transition-all"
                                                title="Delete"
                                            >
                                                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                            </button>
                                        </div>

                                        {/* Content preview */}
                                        <p className="text-[13px] text-[color:var(--vynthen-fg)] leading-relaxed">
                                            {preview}{isLong && <span className="text-[color:var(--vynthen-fg-muted)]">…</span>}
                                        </p>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[11px] text-[color:var(--vynthen-fg-muted)]">
                                                {new Date(item.savedAt).toLocaleDateString()}
                                            </span>
                                            {isLong && (
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedItem(item)}
                                                    className="flex items-center gap-1 text-[12px] font-medium text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] transition-colors"
                                                >
                                                    Read full
                                                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" /></svg>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
