"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../lib/firebase";
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
                await createUserWithEmailAndPassword(auth, email, password);
                onAuthSuccess();
            } else {
                await signInWithEmailAndPassword(auth, email, password);
                console.log("[Auth] Successfully signed in/up with email:", email);
                onAuthSuccess();
            }
        } catch (err: any) {
            console.error("[Auth Error] Manual auth failed:", err);
            const msg = err.message || "An unexpected error occurred.";
            setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleAuth = async () => {
        setLoading(true);
        setError(null);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            console.log("[Auth] Successfully signed in with Google:", result.user.email);
            onAuthSuccess();
        } catch (err: any) {
            console.error("[Auth Error] Google auth failed:", err);
            const msg = err?.message || String(err) || "Google sign-in failed.";
            setError(msg.replace("Firebase: ", "").replace(/\(auth\/.*\)\.?/, "").trim());
        } finally {
            setLoading(false);
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
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg)] py-3 text-[15px] font-medium text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg-secondary)] transition-all disabled:opacity-50"
                >
                    <svg viewBox="0 0 24 24" className="w-5 h-5">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {loading && mode === "login" ? "Signing in..." : "Continue with Google"}
                </button>

                {/* Guest mode */}
                <button
                    type="button"
                    onClick={onGuestMode}
                    className="w-full rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] py-3 text-[15px] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] hover:bg-[color:var(--vynthen-bg)] transition-all"
                >
                    Continue as Guest
                    <span className="block text-xs text-[color:var(--vynthen-fg-muted)] mt-0.5 font-normal">
                        Chats won&apos;t be saved
                    </span>
                </button>

                <p className="text-xs text-[color:var(--vynthen-fg-muted)] text-center opacity-80 mt-2">
                    By signing up you agree to our{" "}
                    <Link
                        href="/tos"
                        className="underline hover:text-[color:var(--vynthen-fg)] transition-colors"
                    >
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacypolicy"
                        className="underline hover:text-[color:var(--vynthen-fg)] transition-colors"
                    >
                        Privacy Policy
                    </Link>.
                </p>
            </div>
        </div>
    );
};
