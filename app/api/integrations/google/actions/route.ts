// ── Google Actions API Route ──────────────────────────────────────────────
// POST { userId, action, params }
// Returns: { success, integrationResultText, requiresConfirmation? }

import { NextRequest, NextResponse } from "next/server";
import { runGoogleAction } from "@/lib/integrations/google";
import { getToken } from "@/lib/integrations/tokenStore";
import { getIntegrationById } from "@/lib/integrations/registry";

export const runtime = "nodejs";

const HIGH_RISK_ACTIONS = new Set(["sendEmail"]);
const MEDIUM_RISK_ACTIONS = new Set(["createCalendarEvent", "createGoogleDoc", "appendRow"]);

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

        // Permission confirmation for medium/high risk
        if (!confirmed && (HIGH_RISK_ACTIONS.has(action) || MEDIUM_RISK_ACTIONS.has(action))) {
            const integration = getIntegrationById("google");
            const actionDef = integration?.actions.find((a) => a.id === action);
            return NextResponse.json({
                requiresConfirmation: true,
                riskLevel: actionDef?.riskLevel ?? "medium",
                message: `This action (${action}) requires your confirmation before proceeding.`,
                action,
                params,
            });
        }

        const token = await getToken(userId, "google");
        if (!token) {
            return NextResponse.json({
                success: false,
                integrationResultText: "Integration not configured yet. Please connect your Google account first.",
            }, { status: 200 });
        }

        const result = await runGoogleAction(action, {
            userId,
            accessToken: token.accessToken,
            refreshToken: token.refreshToken,
        }, params);

        return NextResponse.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: msg, integrationResultText: `INTEGRATION RESULT — Google Workspace — Error: ${msg}` }, { status: 500 });
    }
}
