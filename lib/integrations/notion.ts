// ── Vynthen Integrations — Notion ─────────────────────────────────────────

import type { Integration, ActionContext, ActionResult } from "./types";
import { integrationConfig } from "./config";
import { logActivity } from "./activityLog";

async function notionFetch(apiKey: string, path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`https://api.notion.com/v1${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    });
}

// ── Action Runners ────────────────────────────────────────────────────────

async function searchPages(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const key = integrationConfig.notion.apiKey!;
    const res = await notionFetch(key, "/search", {
        method: "POST",
        body: JSON.stringify({ query: params.query ?? "", filter: { value: "page", property: "object" } }),
    });
    if (!res.ok) throw new Error(`Notion API error: ${res.statusText}`);
    const json = await res.json() as { results?: { id: string; properties?: { title?: { title?: { plain_text?: string }[] } } }[] };
    const lines = (json.results ?? []).slice(0, 10).map((p) => {
        const title = p.properties?.title?.title?.[0]?.plain_text ?? "(untitled)";
        return `• ${title} [id: ${p.id}]`;
    });
    const text = `INTEGRATION RESULT — Notion — searchPages:\n${lines.join("\n") || "No pages found."}`;
    await logActivity({ userId: ctx.userId, integrationId: "notion", action: "searchPages", riskLevel: "low", resultSummary: `Found ${lines.length} pages`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function readPage(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const key = integrationConfig.notion.apiKey!;
    const res = await notionFetch(key, `/pages/${params.pageId}`);
    if (!res.ok) throw new Error(`Notion API error: ${res.statusText}`);
    // Also get blocks
    const blocksRes = await notionFetch(key, `/blocks/${params.pageId}/children`);
    const blocksJson = blocksRes.ok ? await blocksRes.json() as { results?: { type: string;[key: string]: unknown }[] } : { results: [] };
    const blockCount = blocksJson.results?.length ?? 0;
    const text = `INTEGRATION RESULT — Notion — readPage:\nPage ${params.pageId} read. Contains ${blockCount} content blocks.`;
    await logActivity({ userId: ctx.userId, integrationId: "notion", action: "readPage", riskLevel: "low", resultSummary: `Read page ${params.pageId}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function createPage(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const key = integrationConfig.notion.apiKey!;
    const body = {
        parent: { page_id: params.parentPageId },
        properties: {
            title: { title: [{ text: { content: params.title ?? "New Vynthen Page" } }] },
        },
    };
    const res = await notionFetch(key, "/pages", { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Notion API error: ${res.statusText}`);
    const json = await res.json() as { id?: string; url?: string };
    const text = `INTEGRATION RESULT — Notion — createPage:\nPage "${params.title}" created. ID: ${json.id}\nURL: ${json.url}`;
    await logActivity({ userId: ctx.userId, integrationId: "notion", action: "createPage", riskLevel: "medium", resultSummary: `Created page: ${params.title}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function appendToPage(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const key = integrationConfig.notion.apiKey!;
    const block = {
        object: "block",
        type: "paragraph",
        paragraph: {
            rich_text: [{ type: "text", text: { content: params.content ?? "" } }],
        },
    };
    const res = await notionFetch(key, `/blocks/${params.pageId}/children`, {
        method: "PATCH",
        body: JSON.stringify({ children: [block] }),
    });
    if (!res.ok) throw new Error(`Notion API error: ${res.statusText}`);
    const text = `INTEGRATION RESULT — Notion — appendToPage:\nContent appended to page ${params.pageId}.`;
    await logActivity({ userId: ctx.userId, integrationId: "notion", action: "appendToPage", riskLevel: "medium", resultSummary: `Appended to page ${params.pageId}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function createDatabaseEntry(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const key = integrationConfig.notion.apiKey!;
    const properties: Record<string, unknown> = {};
    if (params.name) {
        properties["Name"] = { title: [{ text: { content: params.name } }] };
    }
    const body = { parent: { database_id: params.databaseId }, properties };
    const res = await notionFetch(key, "/pages", { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`Notion API error: ${res.statusText}`);
    const json = await res.json() as { id?: string };
    const text = `INTEGRATION RESULT — Notion — createDatabaseEntry:\nNew entry "${params.name ?? "entry"}" created in database ${params.databaseId}. ID: ${json.id}`;
    await logActivity({ userId: ctx.userId, integrationId: "notion", action: "createDatabaseEntry", riskLevel: "medium", resultSummary: `Created entry in DB ${params.databaseId}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

// ── Action Dispatcher ─────────────────────────────────────────────────────

const actionMap: Record<string, (ctx: ActionContext, params: Record<string, string>) => Promise<ActionResult>> = {
    searchPages,
    readPage,
    createPage,
    appendToPage,
    createDatabaseEntry,
};

export async function runNotionAction(
    action: string,
    ctx: ActionContext,
    params: Record<string, string>
): Promise<ActionResult> {
    const fn = actionMap[action];
    if (!fn) {
        return { success: false, error: `Unknown action: ${action}`, integrationResultText: `INTEGRATION RESULT — Notion — Error: Unknown action "${action}"` };
    }
    if (!integrationConfig.notion.configured) {
        return { success: false, error: "not_configured", integrationResultText: "Integration not configured yet." };
    }
    try {
        return await fn(ctx, params);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logActivity({ userId: ctx.userId, integrationId: "notion", action, riskLevel: "low", resultSummary: `Error: ${msg}`, createdAt: new Date() });
        return { success: false, error: msg, integrationResultText: `INTEGRATION RESULT — Notion — Error: ${msg}` };
    }
}

// ── Integration Manifest ──────────────────────────────────────────────────

export const notionIntegration: Integration = {
    id: "notion",
    name: "Notion",
    description: "Search, read, and create Notion pages and databases",
    icon: "⬜",
    category: "Knowledge",
    requiresAuth: true,
    authType: "token",
    permissions: ["Read pages", "Create pages", "Append content", "Create database entries"],
    intentKeywords: ["save this to notion", "find my note", "add to my notion", "create notion page", "notion", "my notes", "add a note"],
    actions: [
        { id: "searchPages", name: "Search Pages", description: "Search Notion pages", riskLevel: "low", inputSchema: { query: { type: "string", description: "Search query" } }, examplePrompts: ["find my notion notes about X", "search notion for project plan"] },
        { id: "readPage", name: "Read Page", description: "Read a Notion page by ID", riskLevel: "low", inputSchema: { pageId: { type: "string", description: "Page ID", required: true } }, examplePrompts: ["read my notion page"] },
        { id: "createPage", name: "Create Page", description: "Create a new Notion page", riskLevel: "medium", inputSchema: { title: { type: "string", description: "Page title", required: true }, parentPageId: { type: "string", description: "Parent page ID", required: true } }, examplePrompts: ["create a notion page called Sprint Notes"] },
        { id: "appendToPage", name: "Append to Page", description: "Append text to a Notion page", riskLevel: "medium", inputSchema: { pageId: { type: "string", description: "Page ID", required: true }, content: { type: "string", description: "Text to append", required: true } }, examplePrompts: ["add this to my notion page"] },
        { id: "createDatabaseEntry", name: "Create Database Entry", description: "Add a row to a Notion database", riskLevel: "medium", inputSchema: { databaseId: { type: "string", description: "Database ID", required: true }, name: { type: "string", description: "Entry name", required: true } }, examplePrompts: ["add an entry to my notion database"] },
    ],
};
