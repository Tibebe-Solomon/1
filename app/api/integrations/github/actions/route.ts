// ── GitHub Actions API Route ──────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { runGitHubAction } from "@/lib/integrations/github";
import { getToken } from "@/lib/integrations/tokenStore";
import { getIntegrationById } from "@/lib/integrations/registry";

export const runtime = "edge";

const HIGH_RISK_ACTIONS = new Set(["pushFile"]);
const MEDIUM_RISK_ACTIONS = new Set(["createIssue", "createGist"]);

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

        if (!confirmed && (HIGH_RISK_ACTIONS.has(action) || MEDIUM_RISK_ACTIONS.has(action))) {
            const integration = getIntegrationById("github");
            const actionDef = integration?.actions.find((a) => a.id === action);
            return NextResponse.json({
                requiresConfirmation: true,
                riskLevel: actionDef?.riskLevel ?? "medium",
                message: `This action (${action}) requires your confirmation before proceeding.`,
                action,
                params,
            });
        }

        const token = await getToken(userId, "github");
        if (!token) {
            return NextResponse.json({
                success: false,
                integrationResultText: "Integration not configured yet. Please connect your GitHub account first.",
            }, { status: 200 });
        }

        const result = await runGitHubAction(action, {
            userId,
            accessToken: token.accessToken,
        }, params);

        return NextResponse.json(result);
    } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        return NextResponse.json({ success: false, error: msg, integrationResultText: `INTEGRATION RESULT — GitHub — Error: ${msg}` }, { status: 500 });
    }
}
