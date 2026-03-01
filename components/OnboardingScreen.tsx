"use client";

import React, { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

interface OnboardingScreenProps {
    userId: string;
    userEmail: string;
    onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ userId, userEmail, onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        username: "",
        birthdate: "",
        referral: "",
        profileImage: "",
    });

    const calculateAge = (birthday: string) => {
        const ageDifMs = Date.now() - new Date(birthday).getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970);
    };

    const handleNext = () => setStep((s) => s + 1);
    const handleBack = () => setStep((s) => s - 1);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const age = calculateAge(formData.birthdate);
            await setDoc(doc(db, "profiles", userId), {
                ...formData,
                age,
                email: userEmail,
                updatedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
            });
            onComplete();
        } catch (err) {
            console.error("Error saving profile:", err);
            alert("Failed to save profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputClass = "w-full bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] rounded-xl px-4 py-3 text-[14px] text-[color:var(--vynthen-fg)] focus:outline-none focus:ring-2 focus:ring-bw-rainbow transition-all";
    const labelClass = "block text-[12px] font-semibold text-[color:var(--vynthen-fg-muted)] uppercase tracking-wider mb-2 ml-1";

    return (
        <div className="min-h-[100dvh] flex items-center justify-center p-6 bg-[color:var(--vynthen-bg)]">
            <div className="w-full max-w-[440px] animate-in fade-in zoom-in-95 duration-500">

                {/* Progress Bar */}
                <div className="flex gap-2 mb-10 overflow-hidden rounded-full h-1.5 bg-[color:var(--vynthen-border)]">
                    <div
                        className="bg-bw-rainbow h-full transition-all duration-500 ease-out"
                        style={{ width: `${(step / 3) * 100}%` }}
                    />
                </div>

                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-bw-rainbow flex items-center justify-center mx-auto mb-4 shadow-xl">
                        <span className="text-2xl font-bold text-white">V</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[color:var(--vynthen-fg)]">Welcome to Vynthen</h1>
                    <p className="text-[14px] text-[color:var(--vynthen-fg-muted)] mt-2">Let's set up your profile to personalize your experience.</p>
                </div>

                <div className="bg-[color:var(--vynthen-bg)] border border-[color:var(--vynthen-border)] rounded-3xl p-8 shadow-2xl">
                    {step === 1 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className={labelClass}>Full Name</label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="First"
                                        className={inputClass}
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                    <input
                                        type="text"
                                        placeholder="Last"
                                        className={inputClass}
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className={labelClass}>Choose a Username</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--vynthen-fg-muted)]">@</span>
                                    <input
                                        type="text"
                                        placeholder="username"
                                        className={`${inputClass} pl-8`}
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleNext}
                                disabled={!formData.firstName || !formData.lastName || !formData.username}
                                className="w-full py-4 rounded-xl bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] font-bold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                            >
                                Continue
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className={labelClass}>When is your Birthday?</label>
                                <input
                                    type="date"
                                    className={inputClass}
                                    value={formData.birthdate}
                                    onChange={(e) => setFormData({ ...formData, birthdate: e.target.value })}
                                />
                                {formData.birthdate && (
                                    <p className="mt-2 text-xs text-[color:var(--vynthen-fg-muted)]">
                                        You appear to be {calculateAge(formData.birthdate)} years old.
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={labelClass}>Profile Picture URL (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://example.com/photo.jpg"
                                    className={inputClass}
                                    value={formData.profileImage}
                                    onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleBack} className="flex-1 py-4 rounded-xl border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg)] font-semibold text-[15px] hover:bg-[color:var(--vynthen-bg-secondary)] transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={!formData.birthdate}
                                    className="flex-[2] py-4 rounded-xl bg-[color:var(--vynthen-fg)] text-[color:var(--vynthen-bg)] font-bold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50"
                                >
                                    Almost there
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div>
                                <label className={labelClass}>How did you hear about us?</label>
                                <select
                                    className={inputClass}
                                    value={formData.referral}
                                    onChange={(e) => setFormData({ ...formData, referral: e.target.value })}
                                >
                                    <option value="">Select an option</option>
                                    <option value="twitter">X / Twitter</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="friend">A Friend</option>
                                    <option value="advertisement">Advertisement</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-xs text-[color:var(--vynthen-fg-muted)] leading-relaxed">
                                By completing your profile, you agree to our terms and privacy policy. We use this information to customize your experience.
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleBack} className="flex-1 py-4 rounded-xl border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg)] font-semibold text-[15px] hover:bg-[color:var(--vynthen-bg-secondary)] transition-colors" disabled={loading}>
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={!formData.referral || loading}
                                    className="flex-[2] py-4 rounded-xl bg-bw-rainbow text-white font-bold text-[15px] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg relative overflow-hidden"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                            Saving...
                                        </div>
                                    ) : "Launch Vynthen"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <p className="mt-8 text-center text-[12px] text-[color:var(--vynthen-fg-muted)]">
                    Authenticated as <span className="text-[color:var(--vynthen-fg)] font-medium">{userEmail}</span>
                </p>
            </div>
        </div>
    );
};
