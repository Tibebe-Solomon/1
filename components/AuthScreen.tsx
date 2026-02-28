"use client";

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { LogoMark } from "./LogoMark";

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            if (mode === "signup") {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess("Check your email to confirm your account, then log in.");
                setMode("login");
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

    return (
        <div className="min-h-screen flex items-center justify-center bg-[color:var(--vynthen-bg)] p-4">
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

                <p className="text-xs text-[color:var(--vynthen-fg-muted)] text-center opacity-60">
                    By signing up you agree to our terms of service.
                </p>
            </div>
        </div>
    );
};
