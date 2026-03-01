import React, { useState, useEffect, useRef } from "react";

interface LiveVoiceModeProps {
    onClose: () => void;
    onSendVoiceQuery: (transcript: string) => Promise<string>;
}

/* ── Waveform bars component (Gemini-style) ── */
function WaveformBars({ active, color = "var(--vynthen-fg)" }: { active: boolean; color?: string }) {
    const bars = [4, 7, 10, 14, 10, 7, 4, 9, 13, 9, 4, 7, 10, 7, 4];
    return (
        <div className="flex items-center gap-[3px] h-12">
            {bars.map((h, i) => (
                <div
                    key={i}
                    className="rounded-full transition-all"
                    style={{
                        width: 3,
                        height: active ? `${h * 3}px` : "6px",
                        background: color,
                        opacity: active ? 0.85 : 0.3,
                        animation: active ? `waveBar 1.2s ease-in-out infinite` : "none",
                        animationDelay: `${i * 0.07}s`,
                        transition: "height 0.3s ease, opacity 0.3s ease",
                    }}
                />
            ))}
        </div>
    );
}

/* ── Circular pulsing orb ── */
function VoiceOrb({ status }: { status: "idle" | "listening" | "thinking" | "speaking" }) {
    const isActive = status === "listening" || status === "speaking";
    const colorMap = {
        idle: "from-[color:var(--vynthen-bg-secondary)] to-[color:var(--vynthen-border)]",
        listening: "from-rose-500 via-orange-500 to-rose-600",
        thinking: "from-indigo-500 via-purple-500 to-blue-500",
        speaking: "from-indigo-400 via-violet-500 to-purple-600",
    };

    return (
        <div className="relative flex items-center justify-center">
            {/* Outer glow ring */}
            {isActive && (
                <>
                    <div className={`absolute w-40 h-40 rounded-full bg-gradient-to-br ${colorMap[status]} opacity-15 animate-ping`}
                        style={{ animationDuration: "2s" }} />
                    <div className={`absolute w-32 h-32 rounded-full bg-gradient-to-br ${colorMap[status]} opacity-20 animate-ping`}
                        style={{ animationDuration: "1.5s", animationDelay: "0.2s" }} />
                </>
            )}

            {/* Main orb */}
            <div className={`relative w-24 h-24 rounded-full bg-gradient-to-br ${colorMap[status]} flex items-center justify-center shadow-2xl transition-all duration-700 ${isActive ? "scale-110" : "scale-100"}`}>
                {/* Mic icon for listening/idle, waveform for speaking */}
                {status === "speaking" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.038 0-1.958.64-2.318 1.613a9.737 9.737 0 000 6.774c.36.974 1.28 1.613 2.318 1.613h1.932l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 01-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                    </svg>
                ) : status === "thinking" ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10 animate-spin" style={{ animationDuration: "3s" }}>
                        <path fillRule="evenodd" d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567L9.05 4.889c-.02.12-.115.26-.297.348a7.493 7.493 0 00-.986.57c-.166.115-.334.126-.45.083L6.3 5.508a1.875 1.875 0 00-2.282.819l-.922 1.597a1.875 1.875 0 00.432 2.385l.84.692c.095.078.17.229.154.43a7.598 7.598 0 000 1.139c.015.2-.059.352-.153.43l-.841.692a1.875 1.875 0 00-.432 2.385l.922 1.597a1.875 1.875 0 002.282.818l1.019-.382c.115-.043.283-.031.45.082.312.214.641.405.985.57.182.088.277.228.297.35l.178 1.071c.151.904.933 1.567 1.85 1.567h1.844c.916 0 1.699-.663 1.85-1.567l.178-1.072c.02-.12.114-.26.297-.349.344-.165.673-.356.985-.57.167-.114.335-.125.45-.082l1.02.382a1.875 1.875 0 002.28-.819l.923-1.597a1.875 1.875 0 00-.432-2.385l-.84-.692c-.095-.078-.17-.229-.154-.43a7.614 7.614 0 000-1.139c-.016-.2.059-.352.153-.43l.84-.692c.708-.582.891-1.59.433-2.385l-.922-1.597a1.875 1.875 0 00-2.282-.818l-1.02.382c-.114.043-.282.031-.449-.083a7.49 7.49 0 00-.985-.57c-.183-.087-.277-.227-.297-.348l-.179-1.072a1.875 1.875 0 00-1.85-1.567h-1.843zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                )}
            </div>
        </div>
    );
}

export const LiveVoiceMode: React.FC<LiveVoiceModeProps> = ({ onClose, onSendVoiceQuery }) => {
    const [status, setStatus] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
    const [transcript, setTranscript] = useState<string>("");
    const [aiResponseText, setAiResponseText] = useState<string>("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null);
    const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
    const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Keep the latest transcript accessible in setTimeout
    const transcriptRef = useRef(transcript);
    useEffect(() => {
        transcriptRef.current = transcript;
    }, [transcript]);

    useEffect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            recognition.onresult = (event: any) => {
                let currentTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);

                // Clear any existing silence timer
                if (silenceTimerRef.current) {
                    clearTimeout(silenceTimerRef.current);
                }

                // If we have a substantial phrase (e.g. > 3 chars to ignore random background noises like "ah"), set a 2-second silence timer to auto-send
                if (currentTranscript.trim().length > 3) {
                    silenceTimerRef.current = setTimeout(() => {
                        handleAutoSend(currentTranscript);
                    }, 2000);
                }
            };
            recognition.onerror = (event: ErrorEvent) => {
                if (event.error !== "no-speech") setStatus("idle");
            };
            recognitionRef.current = recognition;
        } else {
            alert("Speech recognition is not supported in this browser. Please use Chrome or Edge.");
        }
        handleStartListening();
        return () => {
            window.speechSynthesis.cancel();
            if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
            recognitionRef.current?.stop();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleStartListening = () => {
        window.speechSynthesis.cancel();
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        setTranscript("");
        setAiResponseText("");
        if (recognitionRef.current) {
            try { recognitionRef.current.start(); } catch { /* already started */ }
            setStatus("listening");
        }
    };

    const handleAutoSend = async (finalTranscript: string) => {
        if (!finalTranscript.trim()) return;
        recognitionRef.current?.stop();
        setStatus("thinking");
        try {
            const aiResponse = await onSendVoiceQuery(finalTranscript);
            if (aiResponse) {
                setAiResponseText(aiResponse);
                setStatus("speaking");
                speak(aiResponse);
            } else {
                setStatus("idle");
            }
        } catch {
            setStatus("idle");
        }
    };

    const handleStopListening = async () => {
        if (status !== "listening") return;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        recognitionRef.current?.stop();

        const currentTranscript = transcriptRef.current;
        setStatus("thinking");
        if (!currentTranscript.trim()) { setStatus("idle"); return; }

        try {
            const aiResponse = await onSendVoiceQuery(currentTranscript);
            setAiResponseText(aiResponse);
            setStatus("speaking");
            speak(aiResponse);
        } catch {
            setStatus("idle");
        }
    };

    const speak = (text: string) => {
        if (!window.speechSynthesis) { setStatus("idle"); return; }
        window.speechSynthesis.cancel();
        const cleanText = text.replace(/[*_#`]/g, "");
        const utterance = new SpeechSynthesisUtterance(cleanText);
        speechSynthesisRef.current = utterance;
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find((v) => v.name.includes("Google US English") || v.name.includes("Samantha")) || voices[0];
        if (preferred) utterance.voice = preferred;
        utterance.rate = 1.05;
        utterance.pitch = 1;
        utterance.onend = () => setStatus("idle");
        utterance.onerror = () => setStatus("idle");
        window.speechSynthesis.speak(utterance);
    };

    const handleInterrupt = () => {
        if (status === "speaking" || status === "thinking") {
            window.speechSynthesis.cancel();
            handleStartListening();
        }
    };

    const statusLabel: Record<typeof status, string> = {
        idle: "Tap mic to speak",
        listening: "Listening…",
        thinking: "Thinking…",
        speaking: "Speaking — tap to interrupt",
    };

    return (
        <>
            {/* keyframe for waveBar */}
            <style>{`
        @keyframes waveBar {
          0%, 100% { transform: scaleY(0.5); }
          50% { transform: scaleY(1.4); }
        }
      `}</style>

            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[color:var(--vynthen-bg)] cursor-pointer"
                onClick={handleInterrupt}
            >
                {/* Top bar */}
                <div className="w-full flex items-center justify-between px-6 pt-6 pb-0 z-10">
                    <button
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-[color:var(--vynthen-bg-secondary)] text-[color:var(--vynthen-fg-muted)] hover:text-[color:var(--vynthen-fg)] transition-colors"
                        aria-label="Close voice mode"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <span className="text-[13px] font-medium text-[color:var(--vynthen-fg-muted)] tracking-wide cursor-default" onClick={(e) => e.stopPropagation()}>
                        Vynthen Voice
                    </span>
                    <div className="w-10" />
                </div>

                {/* Central content */}
                <div className="flex flex-col items-center gap-10 px-8 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
                    {/* User transcript */}
                    <div className="min-h-[64px] w-full text-center">
                        {status === "listening" && (
                            <p className="text-xl font-medium text-[color:var(--vynthen-fg)] leading-snug animate-in fade-in">
                                {transcript || <span className="text-[color:var(--vynthen-fg-muted)]">Say something…</span>}
                            </p>
                        )}
                    </div>

                    {/* Orb */}
                    <VoiceOrb status={status} />

                    {/* Waveform */}
                    <WaveformBars
                        active={status === "listening" || status === "speaking"}
                        color={
                            status === "speaking" ? "rgb(129,140,248)"  // indigo-400
                                : status === "listening" ? "rgb(251,113,133)"  // rose-400
                                    : "var(--vynthen-fg-muted)"
                        }
                    />

                    {/* AI response text */}
                    <div className="min-h-[64px] w-full text-center">
                        {(status === "thinking" || status === "speaking") && (
                            <p className="text-base text-[color:var(--vynthen-fg-muted)] leading-relaxed line-clamp-4 animate-in fade-in">
                                {status === "thinking" ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-[color:var(--vynthen-fg-muted)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </span>
                                ) : aiResponseText}
                            </p>
                        )}
                    </div>
                </div>

                {/* Status label + mic button */}
                <div className="flex flex-col items-center gap-4 pb-14" onClick={(e) => e.stopPropagation()}>
                    <span className="text-[13px] text-[color:var(--vynthen-fg-muted)] tracking-wide">
                        {statusLabel[status]}
                    </span>
                    <button
                        onClick={() => status === "listening" ? handleStopListening() : handleStartListening()}
                        aria-label={status === "listening" ? "Stop" : "Start listening"}
                        className={`relative flex items-center justify-center w-[72px] h-[72px] rounded-full transition-all duration-300 shadow-xl ${status === "listening"
                            ? "bg-rose-500 text-white scale-110"
                            : "bg-[color:var(--vynthen-bg-secondary)] border border-[color:var(--vynthen-border)] text-[color:var(--vynthen-fg)] hover:scale-105"
                            }`}
                    >
                        {/* Ripple on listening */}
                        {status === "listening" && (
                            <span className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-30" />
                        )}
                        {status === "listening" ? (
                            /* Stop square */
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                        ) : (
                            /* Mic */
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};
