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

export const Library: React.FC<LibraryProps> = ({ isOpen, onClose }) => {
    const [items, setItems] = useState<SavedItem[]>([]);
    const [activeFolder, setActiveFolder] = useState<string>("All");

    useEffect(() => {
        if (isOpen) {
            try {
                const stored = localStorage.getItem("vynthen-library");
                if (stored) {
                    setItems(JSON.parse(stored));
                }
            } catch { /* ignore */ }
        }
    }, [isOpen]);

    const folders = ["All", ...Array.from(new Set(items.map(item => item.folder)))];

    const deleteItem = (id: string) => {
        const newItems = items.filter(item => item.id !== id);
        setItems(newItems);
        localStorage.setItem("vynthen-library", JSON.stringify(newItems));
    };

    const filteredItems = activeFolder === "All" ? items : items.filter(i => i.folder === activeFolder);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-none transition-all">
            {/* Click outside to close (mobile overlay) */}
            <div className="absolute inset-0 sm:hidden" onClick={onClose} />

            <div className="w-full sm:w-[400px] h-full bg-[color:var(--vynthen-bg)] border-l border-[color:var(--vynthen-border)] shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 relative z-10">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vynthen-border)]">
                    <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-[color:var(--vynthen-fg)]"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                        <h2 className="text-[16px] font-semibold text-[color:var(--vynthen-fg)]">Library</h2>
                    </div>
                    <button onClick={onClose} className="btn-icon p-1 text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] rounded-full hover:bg-[color:var(--vynthen-bg-secondary)]">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Folders */}
                {items.length > 0 && (
                    <div className="flex gap-2 p-4 overflow-x-auto border-b border-[color:var(--vynthen-border)] custom-scrollbar">
                        {folders.map(folder => (
                            <button
                                key={folder}
                                onClick={() => setActiveFolder(folder)}
                                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${activeFolder === folder
                                    ? "bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)]"
                                    : "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]"
                                    }`}
                            >
                                {folder}
                            </button>
                        ))}
                    </div>
                )}

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 mb-4 text-[color:var(--vynthen-fg-muted)]"><path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" /></svg>
                            <p className="text-[14px] font-medium text-[color:var(--vynthen-fg)]">Your Library is empty</p>
                            <p className="text-[13px] text-[color:var(--vynthen-fg-muted)] mt-1 max-w-[200px]">Save important AI responses here to find them easily later.</p>
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <div key={item.id} className="group p-4 rounded-xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] hover:border-[color:var(--vynthen-fg-muted)] transition-colors relative">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-semibold tracking-wider text-[color:var(--vynthen-fg-muted)] uppercase bg-[color:var(--vynthen-border)] px-1.5 py-0.5 rounded">
                                        {item.folder}
                                    </span>
                                    <button onClick={() => deleteItem(item.id)} className="opacity-0 group-hover:opacity-100 text-[color:var(--vynthen-fg-muted)] hover:text-red-500 transition-opacity">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                    </button>
                                </div>
                                <p className="text-[13px] text-[color:var(--vynthen-fg)] leading-relaxed line-clamp-6">{item.content}</p>
                                <div className="mt-3 text-[11px] text-[color:var(--vynthen-fg-muted)]">
                                    {new Date(item.savedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
