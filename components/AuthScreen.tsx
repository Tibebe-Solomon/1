"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { LogoMark } from "./LogoMark";
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "../lib/LegalTexts";

interface AuthScreenProps {
    onAuthSuccess: () => void;
    onGuestMode: () => void;
}

type Mode = "login" | "signup";

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onGuestMode }) => {
    const [mode, setMode] = useState<Mode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [openLegalModal, setOpenLegalModal] = useState<"terms" | "privacy" | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (mode === "signup") {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                if (data.session) {
                    // If confirm email is disabled, they are instantly logged in
                    onAuthSuccess();
                } else {
                    setSuccess("Check your email to confirm your account, then log in.");
                    setMode("login");
                }
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onAuthSuccess();
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        try {
            setError(null);
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Google sign-in failed.";
            setError(msg);
        }
    };

    return (
        <div className="min-h-[100dvh] flex items-center justify-center bg-[color:var(--vynthen-bg)] p-4">
            {/* Background subtle grid pattern */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: "radial-gradient(circle, #ececec 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                }}
            />

            <div className="relative w-full max-w-[400px] flex flex-col items-center gap-8">

                {/* Logo */}
                <div className="flex flex-col items-center gap-3 text-center">
                    <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] shadow-lg">
                        <LogoMark className="w-8 h-8" interactive={false} />
                    </div>
                    <div>
                        <h1 className="text-[1.5rem] font-semibold tracking-tight text-[color:var(--vynthen-fg)]">
                            Vynthen
                        </h1>
                        <p className="text-sm text-[color:var(--vynthen-fg-muted)] mt-0.5">
                            {mode === "login" ? "Welcome back" : "Create your account"}
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="w-full rounded-2xl bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] p-6 shadow-xl">

                    {/* Mode Toggle */}
                    <div className="flex rounded-xl border border-[color:var(--vynthen-border)] p-1 mb-6 bg-[color:var(--vynthen-bg)]">
                        {(["login", "signup"] as Mode[]).map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                                className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${mode === m
                                    ? "bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg)] shadow-sm"
                                    : "text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)]"
                                    }`}
                            >
                                {m === "login" ? "Sign in" : "Sign up"}
                            </button>
                        ))}
                    </div>

                    {/* Status Messages */}
                    {error && (
                        <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                            {success}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-[color:var(--vynthen-fg-muted)] uppercase tracking-wider">
                                Email
                            </label>
                            <input
                                type="email"
                                required
                                autoComplete="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg)] px-4 py-2.5 text-[15px] text-[color:var(--vynthen-fg)] placeholder:text-[color:var(--vynthen-fg-muted)] focus:outline-none focus:border-[color:var(--vynthen-fg-muted)] transition-colors"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-[color:var(--vynthen-fg-muted)] uppercase tracking-wider">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                                className="w-full rounded-xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg)] px-4 py-2.5 text-[15px] text-[color:var(--vynthen-fg)] placeholder:text-[color:var(--vynthen-fg-muted)] focus:outline-none focus:border-[color:var(--vynthen-fg-muted)] transition-colors"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="mt-1 w-full rounded-xl bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] py-2.5 text-[15px] font-semibold hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "…" : mode === "login" ? "Sign in" : "Create account"}
                        </button>
                    </form>
                </div>

                {/* Divider */}
                <div className="flex w-full items-center gap-3">
                    <div className="flex-1 h-px bg-[color:var(--vynthen-border)]" />
                    <span className="text-xs text-[color:var(--vynthen-fg-muted)]">or</span>
                    <div className="flex-1 h-px bg-[color:var(--vynthen-border)]" />
                </div>

                {/* Google Auth */}
                <button
                    type="button"
                    onClick={handleGoogleAuth}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg)] py-3 text-[15px] font-medium text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg-secondary)] transition-all"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                </button>

                {/* Guest mode */}
                <button
                    type="button"
                    onClick={onGuestMode}
                    className="w-full rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] py-3 text-[15px] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg)] transition-all"
                >
                    Continue as Guest
                    <span className="block text-xs text-[color:var(--vynthen-fg-muted)] mt-0.5 font-normal">
                        Chats won't be saved
                    </span>
                </button>

                <p className="text-xs text-[color:var(--vynthen-fg-muted)] text-center opacity-80 mt-2">
                    By signing up you agree to our{" "}
                    <button
                        type="button"
                        onClick={() => setOpenLegalModal("terms")}
                        className="underline hover:text-[color:var(--vynthen-fg)] transition-colors"
                    >
                        Terms of Service
                    </button>{" "}
                    and{" "}
                    <button
                        type="button"
                        onClick={() => setOpenLegalModal("privacy")}
                        className="underline hover:text-[color:var(--vynthen-fg)] transition-colors"
                    >
                        Privacy Policy
                    </button>.
                </p>
            </div>

            {/* Legal Modal Overlay */}
            {openLegalModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-black/40 animate-in fade-in duration-200">
                    <div className="w-full max-w-2xl max-h-[85vh] bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)]">
                            <h2 className="text-lg font-semibold text-[color:var(--vynthen-fg)]">
                                {openLegalModal === "terms" ? "Terms of Service" : "Privacy Policy"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setOpenLegalModal(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-[color:var(--vynthen-fg-muted)] hover:bg-[color:var(--vynthen-border)] hover:text-[color:var(--vynthen-fg)] transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6L6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 text-[14px] leading-relaxed text-[color:var(--vynthen-fg)] whitespace-pre-wrap">
                            {openLegalModal === "terms" ? TERMS_OF_SERVICE : PRIVACY_POLICY}
                        </div>
                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] flex justify-end">
                            <button
                                type="button"
                                onClick={() => setOpenLegalModal(null)}
                                className="px-5 py-2 rounded-xl bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] font-medium hover:opacity-90 transition-opacity"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
