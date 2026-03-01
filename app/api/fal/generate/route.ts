import { NextRequest } from "next/server";
import { fal } from "@fal-ai/client";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes max for video gen

// Configure Fal client
fal.config({
    credentials: "69144993-16e9-489c-9217-ff943e998af9:f2b1f33a2307b282fdbd16cb1bb3e50f"
});

export async function POST(req: NextRequest) {
    try {
        const { type, prompt, messageId } = await req.json();

        if (!prompt) {
            return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    if (type === "fal-image") {
                        controller.enqueue(encoder.encode(`data: {"status": "Generating Image..."}\n\n`));

                        // Generate Image
                        const result = await fal.subscribe("fal-ai/flux/dev", {
                            input: { prompt },
                            logs: true,
                            onQueueUpdate: (update) => {
                                if (update.status === "IN_PROGRESS" && update.logs) {
                                    const logMsg = update.logs.map((l) => l.message).join(" ");
                                    controller.enqueue(encoder.encode(`data: {"status": "Generating Image... ${logMsg}"}\n\n`));
                                }
                            }
                        });

                        // @ts-ignore
                        const imageUrl = result.data.images?.[0]?.url || result.data.url;
                        controller.enqueue(encoder.encode(`data: {"status": "DONE", "url": "${imageUrl}"}\n\n`));

                    } else if (type === "fal-video") {
                        controller.enqueue(encoder.encode(`data: {"status": "Step 1: Generating Initial Image Frame..."}\n\n`));

                        // Step 1: Generate initial image for the video first
                        const imageResult = await fal.subscribe("fal-ai/flux/dev", {
                            input: { prompt: `A cinematic, highly detailed first frame for a video: ${prompt}` }
                        });
                        // @ts-ignore
                        const imageUrl = imageResult.data.images?.[0]?.url || imageResult.data.url;

                        controller.enqueue(encoder.encode(`data: {"status": "Step 2: Animating Video with Minimax...", "thumbnail": "${imageUrl}"}\n\n`));

                        // Step 2: Animate with Minimax
                        const videoResult = await fal.subscribe("fal-ai/minimax-video/image-to-video", {
                            input: {
                                prompt,
                                image_url: imageUrl,
                            },
                            logs: true,
                            onQueueUpdate: (update) => {
                                if (update.status === "IN_PROGRESS" && update.logs) {
                                    const logMsg = update.logs.map((l) => l.message).filter(Boolean).pop(); // Get latest log
                                    if (logMsg) {
                                        controller.enqueue(encoder.encode(`data: {"status": "Animating... ${logMsg}"}\n\n`));
                                    }
                                }
                            }
                        });

                        // @ts-ignore
                        const videoUrl = videoResult.data.video?.url;
                        controller.enqueue(encoder.encode(`data: {"status": "DONE", "url": "${videoUrl}"}\n\n`));
                    } else {
                        controller.enqueue(encoder.encode(`data: {"error": "Invalid type"}\n\n`));
                    }
                } catch (error: any) {
                    console.error("FAL API Error:", error);
                    controller.enqueue(encoder.encode(`data: {"error": "${error?.message || "Generation failed"}"}\n\n`));
                } finally {
                    controller.close();
                }
            }
        });

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
