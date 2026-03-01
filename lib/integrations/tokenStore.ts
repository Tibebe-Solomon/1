// ── Vynthen Integrations — Server-Side Token Store ────────────────────────
// Stores/retrieves OAuth tokens in Firebase Admin Firestore.

import { adminDb } from "../firebaseAdmin";
import type { StoredToken } from "./types";

function tokenDocId(userId: string, integrationId: string) {
    return `${userId}_${integrationId}`;
}

export async function saveToken(token: StoredToken): Promise<void> {
    const docRef = adminDb.collection("integrationTokens").doc(tokenDocId(token.userId, token.integrationId));
    await docRef.set({
        userId: token.userId,
        integrationId: token.integrationId,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken ?? null,
        expiresAt: token.expiresAt?.toISOString() ?? null,
    });
}

export async function getToken(userId: string, integrationId: string): Promise<StoredToken | null> {
    const docRef = adminDb.collection("integrationTokens").doc(tokenDocId(userId, integrationId));
    const snap = await docRef.get();
    if (!snap.exists) return null;
    const data = snap.data()!;
    return {
        userId: data.userId,
        integrationId: data.integrationId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    };
}

export async function deleteToken(userId: string, integrationId: string): Promise<void> {
    await adminDb.collection("integrationTokens").doc(tokenDocId(userId, integrationId)).delete();
}

export async function isConnected(userId: string, integrationId: string): Promise<boolean> {
    const token = await getToken(userId, integrationId);
    if (!token) return false;
    if (token.expiresAt && token.expiresAt < new Date()) return false;
    return true;
}

export async function getConnectedIntegrations(userId: string): Promise<string[]> {
    const snap = await adminDb
        .collection("integrationTokens")
        .where("userId", "==", userId)
        .get();
    return snap.docs.map((d) => d.data().integrationId as string);
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
        await saveToken({ ...token, accessToken: json.access_token, expiresAt });
        return json.access_token;
    } catch {
        return null;
    }
}
