// ── Vynthen Integrations — Server-Side Token Store ────────────────────────
// Stores/retrieves OAuth tokens in Supabase. Never touches localStorage.

import { createClient } from "@supabase/supabase-js";
import type { StoredToken } from "./types";

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key);
}

export async function saveToken(token: StoredToken): Promise<void> {
    const db = getServiceClient();
    // Upsert: one token per user per integration
    await db.from("integration_tokens").upsert(
        {
            user_id: token.userId,
            integration_id: token.integrationId,
            access_token: token.accessToken,
            refresh_token: token.refreshToken ?? null,
            expires_at: token.expiresAt?.toISOString() ?? null,
        },
        { onConflict: "user_id,integration_id" }
    );
}

export async function getToken(userId: string, integrationId: string): Promise<StoredToken | null> {
    const db = getServiceClient();
    const { data, error } = await db
        .from("integration_tokens")
        .select("*")
        .eq("user_id", userId)
        .eq("integration_id", integrationId)
        .single();

    if (error || !data) return null;

    return {
        userId: data.user_id,
        integrationId: data.integration_id,
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? undefined,
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
    };
}

export async function deleteToken(userId: string, integrationId: string): Promise<void> {
    const db = getServiceClient();
    await db
        .from("integration_tokens")
        .delete()
        .eq("user_id", userId)
        .eq("integration_id", integrationId);
}

export async function isConnected(userId: string, integrationId: string): Promise<boolean> {
    const token = await getToken(userId, integrationId);
    if (!token) return false;
    // Check if token is still valid (not expired)
    if (token.expiresAt && token.expiresAt < new Date()) return false;
    return true;
}

export async function getConnectedIntegrations(userId: string): Promise<string[]> {
    const db = getServiceClient();
    const { data } = await db
        .from("integration_tokens")
        .select("integration_id")
        .eq("user_id", userId);

    return (data ?? []).map((row) => row.integration_id);
}

/**
 * Refresh a Google access token using the stored refresh token.
 */
export async function refreshGoogleToken(userId: string): Promise<string | null> {
    const token = await getToken(userId, "google");
    if (!token?.refreshToken) return null;

    try {
        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.GOOGLE_CLIENT_ID!,
                client_secret: process.env.GOOGLE_CLIENT_SECRET!,
                refresh_token: token.refreshToken,
                grant_type: "refresh_token",
            }),
        });

        if (!res.ok) return null;
        const json = await res.json() as { access_token?: string; expires_in?: number };
        if (!json.access_token) return null;

        const expiresAt = new Date(Date.now() + (json.expires_in ?? 3600) * 1000);
        await saveToken({
            ...token,
            accessToken: json.access_token,
            expiresAt,
        });

        return json.access_token;
    } catch {
        return null;
    }
}
