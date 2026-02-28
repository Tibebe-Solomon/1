// ── GitHub OAuth Callback ─────────────────────────────────────────────────

import { NextRequest, NextResponse } from "next/server";
import { integrationConfig } from "@/lib/integrations/config";
import { saveToken } from "@/lib/integrations/tokenStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId encoded in state

    if (!code || !state) {
        return NextResponse.redirect(new URL("/?error=github_oauth_missing_params", req.url));
    }

    if (!integrationConfig.github.configured) {
        return NextResponse.redirect(new URL("/?error=github_not_configured", req.url));
    }

    try {
        const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Accept: "application/json",
            },
            body: new URLSearchParams({
                client_id: integrationConfig.github.clientId!,
                client_secret: integrationConfig.github.clientSecret!,
                code,
                redirect_uri: integrationConfig.github.redirectUri,
            }),
        });

        if (!tokenRes.ok) {
            return NextResponse.redirect(new URL("/?error=github_token_exchange_failed", req.url));
        }

        const tokenData = await tokenRes.json() as {
            access_token?: string;
            token_type?: string;
            scope?: string;
            error?: string;
        };

        if (!tokenData.access_token || tokenData.error) {
            console.error("[GitHub OAuth] Error:", tokenData.error);
            return NextResponse.redirect(new URL("/?error=github_no_access_token", req.url));
        }

        await saveToken({
            userId: state,
            integrationId: "github",
            accessToken: tokenData.access_token,
        });

        return NextResponse.redirect(new URL("/?connected=github", req.url));
    } catch (err) {
        console.error("[GitHub OAuth] Unexpected error:", err);
        return NextResponse.redirect(new URL("/?error=github_oauth_error", req.url));
    }
}
