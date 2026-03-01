// ── Vynthen Integrations — Activity Log ───────────────────────────────────
// Writes action entries to Firebase Admin Firestore `integrationActivity` collection.

import { adminDb } from "../firebaseAdmin";
import type { ActivityLogEntry } from "./types";

export async function logActivity(entry: ActivityLogEntry): Promise<void> {
    try {
        await adminDb.collection("integrationActivity").add({
            userId: entry.userId,
            integrationId: entry.integrationId,
            action: entry.action,
            riskLevel: entry.riskLevel,
            resultSummary: entry.resultSummary,
            createdAt: entry.createdAt.toISOString(),
        });
    } catch (err) {
        console.error("[ActivityLog] Failed to write entry:", err);
    }
}

export async function getRecentActivity(userId: string, limit = 20): Promise<ActivityLogEntry[]> {
    const snap = await adminDb
        .collection("integrationActivity")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .limit(limit)
        .get();

    return snap.docs.map((d) => {
        const data = d.data();
        return {
            userId: data.userId,
            integrationId: data.integrationId,
            action: data.action,
            riskLevel: data.riskLevel,
            resultSummary: data.resultSummary,
            createdAt: new Date(data.createdAt),
        };
    });
}
