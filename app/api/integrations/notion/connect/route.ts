// ── Notion Connect Route ──────────────────────────────────────────────────
// The Notion API key is set via env var. This route validates it and
// marks the integration as "connected" in tokenStore for the user.

import { NextRequest, NextResponse } from "next/server";
import { integrationConfig } from "@/lib/integrations/config";
import { saveToken } from "@/lib/integrations/tokenStore";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as { userId: string };
        const { userId } = body;

        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        if (!integrationConfig.notion.configured) {
            return NextResponse.json({
                success: false,
                message: "Integration not configured yet. Please add NOTION_API_KEY to .env.local.",
            }, { status: 200 });
        }

        // Validate the key by calling Notion search
        const res = await fetch("https://api.notion.com/v1/search", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${integrationConfig.notion.apiKey}`,
                "Notion-Version": "2022-06-28",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: "", page_size: 1 }),
        });

        if (!res.ok) {
            return NextResponse.json({
                success: false,
                message: "Notion API key is invalid or the integration has no accessible content.",
            }, { status: 200 });
        }

        // Store the key as access_token in tokenStore
        await saveToken({
            userId,
            integrationId: "notion",
            accessToken: integrationConfig.notion.apiKey!,
        });

        return NextResponse.json({ success: true, message: "Notion connected successfully." });
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, message: msg }, { status: 500 });
    }
}
