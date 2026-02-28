// ── Vynthen Integrations — Shared Types ────────────────────────────────────

export type RiskLevel = "low" | "medium" | "high";
export type AuthType = "oauth2" | "token" | "none";

export interface IntegrationAction {
    id: string;
    name: string;
    description: string;
    riskLevel: RiskLevel;
    inputSchema: Record<string, { type: string; description: string; required?: boolean }>;
    examplePrompts: string[];
}

export interface Integration {
    id: string;
    name: string;
    description: string;
    icon: string;           // emoji or svg string
    category: string;
    requiresAuth: boolean;
    authType: AuthType;
    permissions: string[];
    actions: IntegrationAction[];
    intentKeywords: string[];
    oauthUrl?: (state: string) => string;
    onConnect?: (userId: string) => Promise<void>;
    onDisconnect?: (userId: string) => Promise<void>;
}

export interface StoredToken {
    integrationId: string;
    userId: string;
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
}

export interface ActivityLogEntry {
    userId: string;
    integrationId: string;
    action: string;
    riskLevel: RiskLevel;
    resultSummary: string;
    createdAt: Date;
}

export interface ActionContext {
    userId: string;
    accessToken: string;
    refreshToken?: string;
}

export interface ActionResult {
    success: boolean;
    data?: unknown;
    error?: string;
    integrationResultText: string;   // Injected into AI context
}
