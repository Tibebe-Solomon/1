// ── Integrations Status Route ─────────────────────────────────────────────
// GET ?userId=<id>
// Returns which integrations are configured (env) and which are connected (DB).

import { NextRequest, NextResponse } from "next/server";
import { integrationConfig } from "@/lib/integrations/config";
import { isConnected } from "@/lib/integrations/tokenStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("userId");

    const configured = {
        google: integrationConfig.google.configured,
        github: integrationConfig.github.configured,
        notion: integrationConfig.notion.configured,
    };

    if (!userId) {
        // Just return config status, no connection info
        return NextResponse.json({
            configured,
            connected: { google: false, github: false, notion: false },
        });
    }

    try {
        const [googleConn, githubConn, notionConn] = await Promise.all([
            isConnected(userId, "google"),
            isConnected(userId, "github"),
            isConnected(userId, "notion"),
        ]);

        return NextResponse.json({
            configured,
            connected: { google: googleConn, github: githubConn, notion: notionConn },
        });
    } catch (err) {
        console.error("[Integrations Status] Error:", err);
        return NextResponse.json({
            configured,
            connected: { google: false, github: false, notion: false },
        });
    }
}
