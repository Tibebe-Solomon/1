// ── Vynthen Integrations — Activity Log ───────────────────────────────────
// Writes action entries to Supabase `integration_activity` table.

import { createClient } from "@supabase/supabase-js";
import type { ActivityLogEntry } from "./types";

function getServiceClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(url, key);
}

export async function logActivity(entry: ActivityLogEntry): Promise<void> {
    try {
        const db = getServiceClient();
        await db.from("integration_activity").insert({
            user_id: entry.userId,
            integration_id: entry.integrationId,
            action: entry.action,
            risk_level: entry.riskLevel,
            result_summary: entry.resultSummary,
            created_at: entry.createdAt.toISOString(),
        });
    } catch (err) {
        console.error("[ActivityLog] Failed to write entry:", err);
    }
}

export async function getRecentActivity(userId: string, limit = 20): Promise<ActivityLogEntry[]> {
    const db = getServiceClient();
    const { data } = await db
        .from("integration_activity")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

    return (data ?? []).map((row) => ({
        userId: row.user_id,
        integrationId: row.integration_id,
        action: row.action,
        riskLevel: row.risk_level,
        resultSummary: row.result_summary,
        createdAt: new Date(row.created_at),
    }));
}
