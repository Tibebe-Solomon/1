import { NextRequest } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const maxDuration = 300;

// Always configure with explicit key — do NOT rely on env for this
fal.config({
    credentials: "69144993-16e9-489c-9217-ff943e998af9:f2b1f33a2307b282fdbd16cb1bb3e50f",
});

export async function POST(req: NextRequest) {
    try {
        const { type, prompt } = await req.json() as { type: string; prompt: string };

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
                    if (type === "fal-image") {
                        send({ status: "Generating image…" });

                        // Use fal.stream as per new SDK docs
                        const falStream = await fal.stream("fal-ai/flux/dev", {
                            input: { prompt },
                        });

                        for await (const event of falStream) {
                            if (event?.images?.[0]?.url) {
                                send({ status: "Processing…", preview: event.images[0].url });
                            }
                        }

                        const result = await falStream.done();
                        // @ts-ignore
                        const imageUrl = result?.images?.[0]?.url ?? result?.data?.images?.[0]?.url;

                        if (!imageUrl) throw new Error("No image URL returned");
                        send({ status: "DONE", url: imageUrl });

                    } else if (type === "fal-video") {
                        send({ status: "Step 1: Creating reference frame…" });

                        // Step 1: Generate base image
                        const imgStream = await fal.stream("fal-ai/flux/dev", {
                            input: { prompt: `Cinematic, highly detailed video first frame: ${prompt}` },
                        });
                        for await (const _ of imgStream) { /* consume stream */ }
                        const imgResult = await imgStream.done();
                        // @ts-ignore
                        const imageUrl = imgResult?.images?.[0]?.url ?? imgResult?.data?.images?.[0]?.url;

                        if (!imageUrl) throw new Error("Failed to generate reference frame");
                        send({ status: "Step 2: Animating with Minimax…", thumbnail: imageUrl });

                        // Step 2: Animate
                        const videoResult = await fal.subscribe("fal-ai/minimax-video/image-to-video", {
                            input: { prompt, image_url: imageUrl },
                            logs: true,
                            onQueueUpdate: (update) => {
                                if (update.status === "IN_PROGRESS" && update.logs?.length) {
                                    const latest = update.logs.map((l) => l.message).filter(Boolean).pop();
                                    if (latest) send({ status: `Animating… ${latest}` });
                                }
                            },
                        });

                        // @ts-ignore
                        const videoUrl = videoResult?.data?.video?.url;
                        if (!videoUrl) throw new Error("No video URL returned");
                        send({ status: "DONE", url: videoUrl });

                    } else {
                        send({ error: "Invalid type. Use fal-image or fal-video." });
                    }

                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : "Generation failed";
                    console.error("[fal/generate] Error:", err);
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
