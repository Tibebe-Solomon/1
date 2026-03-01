import React, { useEffect, useState } from "react";
// import { supabase } from "../lib/supabase"; // Removed legacy Supabase

interface FalMediaRendererProps {
    src: string; // e.g. "fal-image:A futuristic city"
    alt?: string;
    messageId: string;
}

export const FalMediaRenderer: React.FC<FalMediaRendererProps> = ({ src, alt, messageId }) => {
    const isVideo = src.startsWith("fal-video:");
    const prompt = src.replace(/^(fal-image:|fal-video:)/, "").trim();

    const [status, setStatus] = useState<string>("Initializing...");
    const [finalUrl, setFinalUrl] = useState<string | null>(null);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check locally first
        const cached = localStorage.getItem(`fal-${messageId}-${prompt}`);
        if (cached) {
            setFinalUrl(cached);
            return;
        }

        let isMounted = true;

        const generateMedia = async () => {
            try {
                const response = await fetch("/api/fal/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ type: isVideo ? "fal-video" : "fal-image", prompt, messageId })
                });

                if (!response.ok || !response.body) throw new Error("API request failed");

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const messages = chunk.split("\n\n").filter(Boolean);

                    for (const msg of messages) {
                        if (msg.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(msg.slice(6));

                                if (!isMounted) return;

                                if (data.error) {
                                    setError(data.error);
                                    return;
                                }

                                if (data.status === "DONE" && data.url) {
                                    setFinalUrl(data.url);
                                    // Cache locally
                                    localStorage.setItem(`fal-${messageId}-${prompt}`, data.url);
                                    return;
                                }

                                if (data.status) setStatus(data.status);
                                if (data.thumbnail) setThumbnailUrl(data.thumbnail);

                            } catch (e) {
                                // Ignore parse errors on partial chunks
                            }
                        }
                    }
                }
            } catch (err: any) {
                if (isMounted) setError(err.message || "Failed to generate media");
            }
        };

        generateMedia();

        return () => {
            isMounted = false;
        };
    }, [src, prompt, messageId, isVideo]);

    if (error) {
        return (
            <div className="my-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 max-w-sm">
                <p className="font-semibold mb-1">Failed to generate {isVideo ? "video" : "image"}</p>
                <p className="opacity-80 font-mono text-xs">{error}</p>
            </div>
        );
    }

    if (finalUrl) {
        if (isVideo || finalUrl.endsWith(".mp4")) {
            return (
                <video
                    src={finalUrl}
                    controls
                    autoPlay
                    loop
                    muted
                    className="w-full max-w-sm rounded-2xl shadow-md border border-[color:var(--vynthen-border)] object-cover bg-[color:var(--vynthen-bg-secondary)] my-4"
                />
            );
        }
        return (
            <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-sm my-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={finalUrl} alt={alt || prompt} className="w-full h-auto rounded-2xl shadow-md border border-[color:var(--vynthen-border)] object-cover bg-[color:var(--vynthen-bg-secondary)]" loading="lazy" />
            </a>
        );
    }

    // Loading State
    return (
        <div className="relative w-full max-w-sm aspect-square sm:aspect-video rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] my-4 overflow-hidden flex flex-col items-center justify-center text-center p-6 shadow-sm">
            {thumbnailUrl ? (
                <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={thumbnailUrl} alt="Thumbnail preview" className="absolute inset-0 w-full h-full object-cover opacity-30 blur-sm" />
                    <div className="absolute inset-0 bg-black/40" />
                </>
            ) : (
                <div className="absolute inset-0 border-bw-rainbow opacity-50" />
            )}

            <div className="relative z-10 flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-[color:var(--vynthen-fg)] border-r-transparent border-b-[color:var(--vynthen-fg-muted)] border-l-transparent animate-spin" />
                <div>
                    <p className="text-sm font-semibold text-[color:var(--vynthen-fg)]">
                        {isVideo ? "Creating Video AI" : "Generating Image"}
                    </p>
                    <p className="text-xs text-[color:var(--vynthen-fg-muted)] mt-1 font-mono tracking-tight animate-pulse min-h-[16px]">
                        {status}
                    </p>
                </div>
            </div>
        </div>
    );
};
