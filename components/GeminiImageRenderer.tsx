import React, { useEffect, useState } from "react";

interface GeminiImageRendererProps {
    src: string; // e.g. "gemini-image:A futuristic city"
    alt?: string;
    messageId: string;
}

export const GeminiImageRenderer: React.FC<GeminiImageRendererProps> = ({ src, alt, messageId }) => {
    const prompt = src.replace(/^gemini-image:/, "").trim();

    const [status, setStatus] = useState<string>("Initializing...");
    const [finalUrl, setFinalUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Check cache first
        const cacheKey = `gemini-img-${messageId}-${prompt.slice(0, 80)}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            setFinalUrl(cached);
            return;
        }

        let isMounted = true;

        const generate = async () => {
            try {
                const response = await fetch("/api/generate/image", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt }),
                });

                if (!response.ok || !response.body) throw new Error("API request failed");

                const reader = response.body.getReader();
                const decoder = new TextDecoder("utf-8");

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    for (const line of chunk.split("\n\n").filter(Boolean)) {
                        if (!line.startsWith("data: ")) continue;
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (!isMounted) return;
                            if (data.error) { setError(data.error); return; }
                            if (data.status === "DONE" && data.url) {
                                setFinalUrl(data.url);
                                // Cache the data-URL (truncated key to avoid quota)
                                try { localStorage.setItem(cacheKey, data.url); } catch { /* storage full */ }
                                return;
                            }
                            if (data.status) setStatus(data.status);
                        } catch { /* ignore partial chunk parse errors */ }
                    }
                }
            } catch (err: unknown) {
                if (isMounted) setError(err instanceof Error ? err.message : "Failed to generate image");
            }
        };

        generate();
        return () => { isMounted = false; };
    }, [src, prompt, messageId]);

    if (error) {
        return (
            <div className="my-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500 max-w-sm">
                <p className="font-semibold mb-1">Failed to generate image</p>
                <p className="opacity-80 font-mono text-xs">{error}</p>
            </div>
        );
    }

    if (finalUrl) {
        return (
            <a href={finalUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-sm my-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={finalUrl}
                    alt={alt || prompt}
                    className="w-full h-auto rounded-2xl shadow-md border border-[color:var(--vynthen-border)] object-cover bg-[color:var(--vynthen-bg-secondary)]"
                    loading="lazy"
                />
            </a>
        );
    }

    // Loading state
    return (
        <div className="relative w-full max-w-sm aspect-square rounded-2xl border border-[color:var(--vynthen-border)] bg-[color:var(--vynthen-bg-secondary)] my-4 flex flex-col items-center justify-center text-center p-6 shadow-sm">
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-t-[color:var(--vynthen-fg)] border-r-transparent border-b-[color:var(--vynthen-fg-muted)] border-l-transparent animate-spin" />
                <div>
                    <p className="text-sm font-semibold text-[color:var(--vynthen-fg)]">Generating Image</p>
                    <p className="text-xs text-[color:var(--vynthen-fg-muted)] mt-1 font-mono tracking-tight animate-pulse min-h-[16px]">
                        {status}
                    </p>
                </div>
            </div>
        </div>
    );
};
