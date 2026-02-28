// ── Notion Actions API Route ──────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { runNotionAction } from "@/lib/integrations/notion";
import { getToken } from "@/lib/integrations/tokenStore";
import { getIntegrationById } from "@/lib/integrations/registry";

export const runtime = "nodejs";

const MEDIUM_RISK_ACTIONS = new Set(["createPage", "appendToPage", "createDatabaseEntry"]);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json() as {
            userId: string;
            action: string;
            params?: Record<string, string>;
            confirmed?: boolean;
        };

        const { userId, action, params = {}, confirmed = false } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });
        }

        if (!confirmed && MEDIUM_RISK_ACTIONS.has(action)) {
            const integration = getIntegrationById("notion");
            const actionDef = integration?.actions.find((a) => a.id === action);
            return NextResponse.json({
                requiresConfirmation: true,
                riskLevel: actionDef?.riskLevel ?? "medium",
                message: `This action (${action}) requires your confirmation before proceeding.`,
                action,
                params,
            });
        }

        const token = await getToken(userId, "notion");
        if (!token) {
            return NextResponse.json({
                success: false,
                integrationResultText: "Integration not configured yet. Please connect your Notion workspace first.",
            }, { status: 200 });
        }

        const result = await runNotionAction(action, {
            userId,
            accessToken: token.accessToken,
        }, params);

        return NextResponse.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: msg, integrationResultText: `INTEGRATION RESULT — Notion — Error: ${msg}` }, { status: 500 });
    }
}
