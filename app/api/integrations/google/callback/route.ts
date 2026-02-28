// ── Google OAuth Callback ─────────────────────────────────────────────────
// Receives the authorization code from Google, exchanges it for tokens,
// and stores them server-side in Supabase.

import { NextRequest, NextResponse } from "next/server";
import { integrationConfig } from "@/lib/integrations/config";
import { saveToken } from "@/lib/integrations/tokenStore";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state"); // userId encoded in state

    if (!code || !state) {
        return NextResponse.redirect(new URL("/?error=google_oauth_missing_params", req.url));
    }

    if (!integrationConfig.google.configured) {
        return NextResponse.redirect(new URL("/?error=google_not_configured", req.url));
    }

    try {
        // Exchange code for tokens
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                code,
                client_id: integrationConfig.google.clientId!,
                client_secret: integrationConfig.google.clientSecret!,
                redirect_uri: integrationConfig.google.redirectUri,
                grant_type: "authorization_code",
            }),
        });

        if (!tokenRes.ok) {
            const err = await tokenRes.text();
            console.error("[Google OAuth] Token exchange failed:", err);
            return NextResponse.redirect(new URL("/?error=google_token_exchange_failed", req.url));
        }

        const tokenData = await tokenRes.json() as {
            access_token?: string;
            refresh_token?: string;
            expires_in?: number;
        };

        if (!tokenData.access_token) {
            return NextResponse.redirect(new URL("/?error=google_no_access_token", req.url));
        }

        const expiresAt = new Date(Date.now() + (tokenData.expires_in ?? 3600) * 1000);

        await saveToken({
            userId: state,        // state = userId
            integrationId: "google",
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt,
        });

        return NextResponse.redirect(new URL("/?connected=google", req.url));
    } catch (err) {
        console.error("[Google OAuth] Unexpected error:", err);
        return NextResponse.redirect(new URL("/?error=google_oauth_error", req.url));
    }
}
