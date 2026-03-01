import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY!;

export async function POST(req: NextRequest) {
    try {
        const { prompt } = await req.json() as { prompt: string };

        if (!prompt?.trim()) {
            return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
        }

        const encoder = new TextEncoder();

        const stream = new ReadableStream({
            async start(controller) {
                const send = (data: object) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                try {
                    send({ status: "Generating image with Gemini…" });

                    // Call Gemini 2.0 Flash image generation (imagen3 via Gemini API)
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=${GEMINI_API_KEY}`,
                        {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [
                                    {
                                        parts: [{ text: prompt }],
                                    },
                                ],
                                generationConfig: {
                                    responseModalities: ["TEXT", "IMAGE"],
                                },
                            }),
                        }
                    );

                    if (!response.ok) {
                        const errText = await response.text();
                        throw new Error(`Gemini API error: ${response.status} — ${errText}`);
                    }

                    const data = await response.json() as {
                        candidates?: Array<{
                            content?: {
                                parts?: Array<{
                                    inlineData?: { mimeType: string; data: string };
                                    text?: string;
                                }>;
                            };
                        }>;
                    };

                    const parts = data.candidates?.[0]?.content?.parts ?? [];
                    const imagePart = parts.find((p) => p.inlineData?.data);

                    if (!imagePart?.inlineData) {
                        throw new Error("No image returned from Gemini");
                    }

                    // Return as a data URL so the browser can render without CORS issues
                    const { mimeType, data: b64 } = imagePart.inlineData;
                    const dataUrl = `data:${mimeType};base64,${b64}`;

                    send({ status: "DONE", url: dataUrl });

                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Generation failed";
                    console.error("[generate/image] Error:", err);
                    send({ error: msg });
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            },
        });

    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Request error";
        return new Response(JSON.stringify({ error: msg }), { status: 500 });
    }
}
