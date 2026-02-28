"use client";

import React, { useCallback, useEffect, useState } from "react";

interface IntegrationStatus {
    configured: Record<string, boolean>;
    connected: Record<string, boolean>;
}

interface IntegrationMeta {
    id: string;
    name: string;
    description: string;
    icon: string;
    authType: "oauth2" | "token";
}

const INTEGRATIONS: IntegrationMeta[] = [
    { id: "google", name: "Google Workspace", description: "Gmail, Drive, Calendar, Docs & Sheets", icon: "🔵", authType: "oauth2" },
    { id: "github", name: "GitHub", description: "Repos, Issues, PRs, Gists & File push", icon: "⚫", authType: "oauth2" },
    { id: "notion", name: "Notion", description: "Pages, Databases & Notes", icon: "⬜", authType: "token" },
];

interface ConfirmModal {
    show: boolean;
    integrationId: string;
    action: string;
    riskLevel: string;
    message: string;
    params: Record<string, string>;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userId: string | null;
    onConnectionsChanged: (connectedIds: string[]) => void;
}

export const IntegrationsPanel: React.FC<Props> = ({ isOpen, onClose, userId, onConnectionsChanged }) => {
    const [status, setStatus] = useState<IntegrationStatus>({ configured: {}, connected: {} });
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [confirmModal, setConfirmModal] = useState<ConfirmModal>({ show: false, integrationId: "", action: "", riskLevel: "", message: "", params: {} });

    const fetchStatus = useCallback(async () => {
        const url = userId ? `/api/integrations/status?userId=${userId}` : "/api/integrations/status";
        const res = await fetch(url);
        if (res.ok) {
            const data = await res.json() as IntegrationStatus;
            setStatus(data);
            const connected = Object.entries(data.connected)
                .filter(([, v]) => v)
                .map(([k]) => k);
            onConnectionsChanged(connected);
        }
    }, [userId, onConnectionsChanged]);

    useEffect(() => {
        if (isOpen) fetchStatus();
    }, [isOpen, fetchStatus]);

    // Handle ?connected=xxx or ?error=xxx from OAuth redirects
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("connected")) {
            fetchStatus();
            // Clean up URL
            window.history.replaceState({}, "", window.location.pathname);
        }
    }, [fetchStatus]);

    const handleConnect = async (integration: IntegrationMeta) => {
        if (!userId) {
            alert("You must be signed in to connect integrations.");
            return;
        }
        setLoading((prev) => ({ ...prev, [integration.id]: true }));

        if (integration.authType === "oauth2") {
            // Start OAuth flow — redirect browser
            const stateParam = encodeURIComponent(userId);
            if (integration.id === "google") {
                window.location.href = `/api/integrations/google/callback?init=true&state=${stateParam}`;
                // Actually, we redirect to the Google OAuth URL directly
                const res = await fetch(`/api/integrations/google/callback?getUrl=true&state=${stateParam}`);
                if (res.ok) {
                    const data = await res.json() as { url?: string };
                    if (data.url) { window.location.href = data.url; return; }
                }
                // Fallback: build URL client-side for immediate redirect
                const params = new URLSearchParams({
                    client_id: "522033869998-dui9gbeu452haiph8k28brhhmk830je8.apps.googleusercontent.com",
                    redirect_uri: `${window.location.origin}/api/integrations/google/callback`,
                    response_type: "code",
                    scope: ["https://www.googleapis.com/auth/gmail.readonly", "https://www.googleapis.com/auth/gmail.compose", "https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/drive.readonly", "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/documents", "https://www.googleapis.com/auth/spreadsheets"].join(" "),
                    access_type: "offline",
                    prompt: "consent",
                    state: userId,
                });
                window.location.href = `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
            } else if (integration.id === "github") {
                const params = new URLSearchParams({
                    client_id: "Ov23liZRFg0O2HFAOfx0",
                    redirect_uri: `${window.location.origin}/api/integrations/github/callback`,
                    scope: "repo gist read:user",
                    state: userId,
                });
                window.location.href = `https://github.com/login/oauth/authorize?${params.toString()}`;
            }
        } else {
            // Token-based (Notion) — call connect endpoint
            const res = await fetch(`/api/integrations/notion/connect`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });
            const data = await res.json() as { success?: boolean; message?: string };
            if (data.success) {
                await fetchStatus();
            } else {
                alert(data.message ?? "Failed to connect Notion.");
            }
        }
        setLoading((prev) => ({ ...prev, [integration.id]: false }));
    };

    const handleDisconnect = async (integrationId: string) => {
        if (!userId) return;
        setLoading((prev) => ({ ...prev, [integrationId]: true }));
        await fetch(`/api/integrations/status`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId, integrationId }),
        });
        await fetchStatus();
        setLoading((prev) => ({ ...prev, [integrationId]: false }));
    };

    if (!isOpen) return null;

    const riskColors: Record<string, string> = {
        low: "text-emerald-400",
        medium: "text-amber-400",
        high: "text-red-400",
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Panel */}
            <div className="fixed right-0 top-0 bottom-0 z-50 w-[380px] max-w-full flex flex-col bg-[color:var(--vynthen-bg)] border-l border-[color:var(--vynthen-border)] shadow-2xl animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--vynthen-border)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                                <path fillRule="evenodd" d="M12 6.75a5.25 5.25 0 016.775-5.025.75.75 0 01.313 1.248l-3.32 3.319c.063.475.276.934.641 1.299.365.365.824.578 1.3.641l3.318-3.319a.75.75 0 011.248.313 5.25 5.25 0 01-5.472 6.756c-1.018-.086-1.87.1-2.309.634L7.344 21.3A3.298 3.298 0 112.7 16.657l8.684-7.151c.533-.44.72-1.291.634-2.309A5.342 5.342 0 0112 6.75zM4.117 19.125a.75.75 0 01.75-.75h.008a.75.75 0 01.75.75v.008a.75.75 0 01-.75.75h-.008a.75.75 0 01-.75-.75v-.008z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="font-semibold text-[15px] text-[color:var(--vynthen-fg)]">Integrations</h2>
                            <p className="text-xs text-[color:var(--vynthen-fg-muted)]">Connect your apps to Vynthen</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="btn-icon rounded-lg" aria-label="Close integrations panel">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Integration cards */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                    {INTEGRATIONS.map((integration) => {
                        const isConfigured = status.configured[integration.id] ?? false;
                        const isConnected = status.connected[integration.id] ?? false;
                        const isLoading = loading[integration.id] ?? false;

                        return (
                            <div
                                key={integration.id}
                                className={`rounded-2xl border p-4 transition-all duration-200 ${isConnected
                                    ? "border-emerald-500/30 bg-emerald-500/5"
                                    : "border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)]"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-sm border ${isConnected ? "border-emerald-500/30 bg-emerald-500/10" : "border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg)]"}`}>
                                            {integration.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[14px] text-[color:var(--vynthen-fg)]">{integration.name}</span>
                                                {isConnected && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-400">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                                        Connected
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-[color:var(--vynthen-fg-muted)] mt-0.5">{integration.description}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    {!isConfigured ? (
                                        <div className="text-xs text-[color:var(--vynthen-fg-muted)] bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] rounded-lg px-3 py-1.5 w-full text-center">
                                            Integration not configured yet.
                                        </div>
                                    ) : isConnected ? (
                                        <button
                                            onClick={() => handleDisconnect(integration.id)}
                                            disabled={isLoading}
                                            className="flex-1 text-xs font-medium py-1.5 px-3 rounded-xl border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] hover:text-red-400 hover:border-red-400/30 transition-colors disabled:opacity-50"
                                        >
                                            {isLoading ? "Disconnecting…" : "Disconnect"}
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleConnect(integration)}
                                            disabled={isLoading}
                                            className="flex-1 text-xs font-semibold py-1.5 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                                        >
                                            {isLoading ? "Connecting…" : `Connect ${integration.name}`}
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer note */}
                <div className="px-5 py-3 border-t border-[color:var(--vynthen-border)]">
                    <p className="text-[11px] text-[color:var(--vynthen-fg-muted)] text-center">
                        🔒 Tokens are stored securely server-side. Never in your browser.
                    </p>
                </div>
            </div>

            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] rounded-2xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${confirmModal.riskLevel === "high" ? "bg-red-500/15" : "bg-amber-500/15"}`}>
                                ⚠️
                            </div>
                            <div>
                                <h3 className="font-semibold text-[color:var(--vynthen-fg)]">Confirm Action</h3>
                                <span className={`text-xs font-medium ${riskColors[confirmModal.riskLevel] ?? "text-amber-400"}`}>
                                    {confirmModal.riskLevel} risk
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-[color:var(--vynthen-fg-muted)] mb-5">{confirmModal.message}</p>
                        <div className="flex gap-2">
                            <button onClick={() => setConfirmModal((c) => ({ ...c, show: false }))} className="flex-1 py-2 rounded-xl text-sm border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    setConfirmModal((c) => ({ ...c, show: false }));
                                    // Re-call action with confirmed=true — handled externally
                                }}
                                className="flex-1 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:opacity-90 transition-opacity"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
