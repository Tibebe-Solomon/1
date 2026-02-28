// ── Vynthen Integrations — Credentials Config ─────────────────────────────
// All values are read exclusively from environment variables (server-side).
// Never import this file in client components.

export const integrationConfig = {
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID ?? null,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? null,
        redirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3000/api/integrations/google/callback",
        configured: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    github: {
        clientId: process.env.GITHUB_CLIENT_ID ?? null,
        clientSecret: process.env.GITHUB_CLIENT_SECRET ?? null,
        redirectUri: process.env.GITHUB_REDIRECT_URI ?? "http://localhost:3000/api/integrations/github/callback",
        configured: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
    notion: {
        apiKey: process.env.NOTION_API_KEY ?? null,
        configured: !!process.env.NOTION_API_KEY,
    },
} as const;
