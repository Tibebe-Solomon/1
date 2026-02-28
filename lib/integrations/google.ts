// ── Vynthen Integrations — Google Workspace ───────────────────────────────

import type { Integration, ActionContext, ActionResult } from "./types";
import { integrationConfig } from "./config";
import { logActivity } from "./activityLog";
import { refreshGoogleToken } from "./tokenStore";

const SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.compose",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/documents",
    "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

export function getGoogleOAuthUrl(state: string): string {
    const params = new URLSearchParams({
        client_id: integrationConfig.google.clientId!,
        redirect_uri: integrationConfig.google.redirectUri,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent",
        state,
    });
    return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`;
}

async function googleFetch(
    ctx: ActionContext,
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    let res = await fetch(url, {
        ...options,
        headers: {
            Authorization: `Bearer ${ctx.accessToken}`,
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    });

    // If token expired, try refresh
    if (res.status === 401 && ctx.refreshToken) {
        const newToken = await refreshGoogleToken(ctx.userId);
        if (newToken) {
            ctx.accessToken = newToken;
            res = await fetch(url, {
                ...options,
                headers: {
                    Authorization: `Bearer ${newToken}`,
                    "Content-Type": "application/json",
                    ...(options.headers ?? {}),
                },
            });
        }
    }
    return res;
}

// ── Action Runners ────────────────────────────────────────────────────────

async function listEmails(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const maxResults = params.maxResults ?? "10";
    const res = await googleFetch(ctx, `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}&labelIds=INBOX`);
    if (!res.ok) throw new Error(`Gmail API error: ${res.statusText}`);
    const json = await res.json() as { messages?: { id: string }[] };
    const ids = (json.messages ?? []).slice(0, 5).map((m) => m.id);

    // Fetch snippets for first 5
    const details = await Promise.all(
        ids.map((id) =>
            googleFetch(ctx, `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From`)
                .then((r) => r.json())
        )
    );

    const lines = (details as Array<{ payload?: { headers?: { name: string; value: string }[] }; snippet?: string }>).map((d) => {
        const headers = d.payload?.headers ?? [];
        const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)";
        const from = headers.find((h) => h.name === "From")?.value ?? "unknown";
        return `• From: ${from} | Subject: ${subject}`;
    });

    const text = `INTEGRATION RESULT — Google Workspace — listEmails:\n${lines.join("\n")}`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "listEmails", riskLevel: "low", resultSummary: `Fetched ${lines.length} emails`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function searchEmails(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const q = encodeURIComponent(params.query ?? "");
    const res = await googleFetch(ctx, `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${q}&maxResults=5`);
    if (!res.ok) throw new Error(`Gmail API error: ${res.statusText}`);
    const json = await res.json() as { messages?: { id: string }[]; resultSizeEstimate?: number };
    const count = json.messages?.length ?? 0;
    const text = `INTEGRATION RESULT — Google Workspace — searchEmails:\nFound ${count} emails matching "${params.query ?? ""}". IDs: ${(json.messages ?? []).map((m) => m.id).join(", ")}`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "searchEmails", riskLevel: "low", resultSummary: `Found ${count} results`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function sendEmail(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { to, subject, body } = params;
    const raw = btoa(`To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`)
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await googleFetch(ctx, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        body: JSON.stringify({ raw }),
    });
    if (!res.ok) throw new Error(`Send failed: ${res.statusText}`);
    const text = `INTEGRATION RESULT — Google Workspace — sendEmail:\nEmail sent to ${to} with subject "${subject}".`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "sendEmail", riskLevel: "high", resultSummary: `Sent to ${to}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function listDriveFiles(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const pageSize = params.pageSize ?? "10";
    const res = await googleFetch(ctx, `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&fields=files(id,name,mimeType,modifiedTime)`);
    if (!res.ok) throw new Error(`Drive API error: ${res.statusText}`);
    const json = await res.json() as { files?: { id: string; name: string; mimeType: string; modifiedTime: string }[] };
    const lines = (json.files ?? []).map((f) => `• ${f.name} (${f.mimeType}) — modified: ${f.modifiedTime}`);
    const text = `INTEGRATION RESULT — Google Workspace — listDriveFiles:\n${lines.join("\n")}`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "listDriveFiles", riskLevel: "low", resultSummary: `Listed ${lines.length} files`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function searchDriveFiles(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const query = encodeURIComponent(`name contains '${params.query ?? ""}'`);
    const res = await googleFetch(ctx, `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType)`);
    if (!res.ok) throw new Error(`Drive API error: ${res.statusText}`);
    const json = await res.json() as { files?: { id: string; name: string; mimeType: string }[] };
    const lines = (json.files ?? []).map((f) => `• ${f.name} (${f.mimeType}) [id: ${f.id}]`);
    const text = `INTEGRATION RESULT — Google Workspace — searchDriveFiles:\n${lines.join("\n") || "No files found."}`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "searchDriveFiles", riskLevel: "low", resultSummary: `Found ${lines.length} matching files`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function listCalendarEvents(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const timeMin = encodeURIComponent(new Date().toISOString());
    const maxResults = params.maxResults ?? "10";
    const res = await googleFetch(ctx, `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&maxResults=${maxResults}&singleEvents=true&orderBy=startTime`);
    if (!res.ok) throw new Error(`Calendar API error: ${res.statusText}`);
    const json = await res.json() as { items?: { summary?: string; start?: { dateTime?: string; date?: string } }[] };
    const lines = (json.items ?? []).map((e) => `• ${e.summary ?? "(no title)"} — ${e.start?.dateTime ?? e.start?.date ?? "TBD"}`);
    const text = `INTEGRATION RESULT — Google Workspace — listCalendarEvents:\n${lines.join("\n") || "No upcoming events."}`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "listCalendarEvents", riskLevel: "low", resultSummary: `Fetched ${lines.length} events`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function createCalendarEvent(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { title, start, end, description } = params;
    const body = { summary: title, description, start: { dateTime: start, timeZone: "UTC" }, end: { dateTime: end, timeZone: "UTC" } };
    const res = await googleFetch(ctx, "https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Calendar API error: ${res.statusText}`);
    const text = `INTEGRATION RESULT — Google Workspace — createCalendarEvent:\nEvent "${title}" created from ${start} to ${end}.`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "createCalendarEvent", riskLevel: "medium", resultSummary: `Created event: ${title}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function readGoogleDoc(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const res = await googleFetch(ctx, `https://docs.googleapis.com/v1/documents/${params.documentId}`);
    if (!res.ok) throw new Error(`Docs API error: ${res.statusText}`);
    const json = await res.json() as { title?: string; body?: { content?: unknown[] } };
    const text = `INTEGRATION RESULT — Google Workspace — readGoogleDoc:\nDocument: "${json.title ?? "Untitled"}"\nContent sections: ${json.body?.content?.length ?? 0}`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "readGoogleDoc", riskLevel: "low", resultSummary: `Read doc ${params.documentId}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function createGoogleDoc(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const res = await googleFetch(ctx, "https://docs.googleapis.com/v1/documents", {
        method: "POST",
        body: JSON.stringify({ title: params.title ?? "New Vynthen Doc" }),
    });
    if (!res.ok) throw new Error(`Docs API error: ${res.statusText}`);
    const json = await res.json() as { title?: string; documentId?: string };
    const text = `INTEGRATION RESULT — Google Workspace — createGoogleDoc:\nDocument "${json.title}" created. ID: ${json.documentId}`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "createGoogleDoc", riskLevel: "medium", resultSummary: `Created doc: ${json.title}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function readSheet(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { spreadsheetId, range } = params;
    const res = await googleFetch(ctx, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range ?? "Sheet1!A1:Z100")}`);
    if (!res.ok) throw new Error(`Sheets API error: ${res.statusText}`);
    const json = await res.json() as { values?: string[][] };
    const rowCount = json.values?.length ?? 0;
    const text = `INTEGRATION RESULT — Google Workspace — readSheet:\nSheet has ${rowCount} rows of data.`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "readSheet", riskLevel: "low", resultSummary: `Read ${rowCount} rows`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function appendRow(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { spreadsheetId, range, values } = params;
    const rows = [values.split(",").map((v) => v.trim())];
    const res = await googleFetch(ctx, `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range ?? "Sheet1")}:append?valueInputOption=USER_ENTERED`, {
        method: "POST",
        body: JSON.stringify({ values: rows }),
    });
    if (!res.ok) throw new Error(`Sheets API error: ${res.statusText}`);
    const text = `INTEGRATION RESULT — Google Workspace — appendRow:\nRow appended: [${values}]`;
    await logActivity({ userId: ctx.userId, integrationId: "google", action: "appendRow", riskLevel: "medium", resultSummary: `Appended row to ${spreadsheetId}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

// ── Action Dispatcher ─────────────────────────────────────────────────────

const actionMap: Record<string, (ctx: ActionContext, params: Record<string, string>) => Promise<ActionResult>> = {
    listEmails,
    searchEmails,
    sendEmail,
    listDriveFiles,
    searchDriveFiles,
    listCalendarEvents,
    createCalendarEvent,
    readGoogleDoc,
    createGoogleDoc,
    readSheet,
    appendRow,
};

export async function runGoogleAction(
    action: string,
    ctx: ActionContext,
    params: Record<string, string>
): Promise<ActionResult> {
    const fn = actionMap[action];
    if (!fn) {
        return { success: false, error: `Unknown action: ${action}`, integrationResultText: `INTEGRATION RESULT — Google Workspace — Error: Unknown action "${action}"` };
    }
    if (!integrationConfig.google.configured) {
        return { success: false, error: "not_configured", integrationResultText: "Integration not configured yet." };
    }
    try {
        return await fn(ctx, params);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logActivity({ userId: ctx.userId, integrationId: "google", action, riskLevel: "low", resultSummary: `Error: ${msg}`, createdAt: new Date() });
        return { success: false, error: msg, integrationResultText: `INTEGRATION RESULT — Google Workspace — Error: ${msg}` };
    }
}

// ── Integration Manifest ──────────────────────────────────────────────────

export const googleIntegration: Integration = {
    id: "google",
    name: "Google Workspace",
    description: "Access Gmail, Drive, Calendar, Docs, and Sheets",
    icon: "🔵",
    category: "Productivity",
    requiresAuth: true,
    authType: "oauth2",
    permissions: ["Gmail read/send", "Drive read/write", "Calendar read/write", "Docs read/write", "Sheets read/write"],
    intentKeywords: ["check my email", "schedule meeting", "find my doc", "send email", "add to sheet", "my calendar", "google drive", "gmail", "spreadsheet", "google docs"],
    actions: [
        { id: "listEmails", name: "List Emails", description: "List recent inbox emails", riskLevel: "low", inputSchema: { maxResults: { type: "number", description: "Number of emails to fetch" } }, examplePrompts: ["check my email", "show my inbox"] },
        { id: "searchEmails", name: "Search Emails", description: "Search Gmail by query", riskLevel: "low", inputSchema: { query: { type: "string", description: "Gmail search query", required: true } }, examplePrompts: ["find emails from john", "search my email for invoice"] },
        { id: "sendEmail", name: "Send Email", description: "Send an email", riskLevel: "high", inputSchema: { to: { type: "string", description: "Recipient email", required: true }, subject: { type: "string", description: "Subject line", required: true }, body: { type: "string", description: "Email body", required: true } }, examplePrompts: ["send email to jane about the meeting"] },
        { id: "listDriveFiles", name: "List Drive Files", description: "List files in Google Drive", riskLevel: "low", inputSchema: { pageSize: { type: "number", description: "Number of files" } }, examplePrompts: ["show my drive files", "list my documents"] },
        { id: "searchDriveFiles", name: "Search Drive", description: "Search for files in Drive", riskLevel: "low", inputSchema: { query: { type: "string", description: "Search keyword", required: true } }, examplePrompts: ["find my report on drive", "search drive"] },
        { id: "listCalendarEvents", name: "List Events", description: "Show upcoming calendar events", riskLevel: "low", inputSchema: { maxResults: { type: "number", description: "Number of events" } }, examplePrompts: ["what's on my calendar", "show upcoming events"] },
        { id: "createCalendarEvent", name: "Create Event", description: "Create a calendar event", riskLevel: "medium", inputSchema: { title: { type: "string", description: "Event title", required: true }, start: { type: "string", description: "Start ISO datetime", required: true }, end: { type: "string", description: "End ISO datetime", required: true }, description: { type: "string", description: "Description" } }, examplePrompts: ["schedule a meeting tomorrow at 3pm"] },
        { id: "readGoogleDoc", name: "Read Doc", description: "Read a Google Doc by ID", riskLevel: "low", inputSchema: { documentId: { type: "string", description: "Document ID", required: true } }, examplePrompts: ["read my google doc"] },
        { id: "createGoogleDoc", name: "Create Doc", description: "Create a new Google Doc", riskLevel: "medium", inputSchema: { title: { type: "string", description: "Document title", required: true } }, examplePrompts: ["create a google doc called Project Plan"] },
        { id: "readSheet", name: "Read Sheet", description: "Read data from a Google Sheet", riskLevel: "low", inputSchema: { spreadsheetId: { type: "string", description: "Spreadsheet ID", required: true }, range: { type: "string", description: "Range e.g. Sheet1!A1:Z100" } }, examplePrompts: ["read my spreadsheet", "show my sheet data"] },
        { id: "appendRow", name: "Append Row", description: "Append a row to a Google Sheet", riskLevel: "medium", inputSchema: { spreadsheetId: { type: "string", description: "Spreadsheet ID", required: true }, range: { type: "string", description: "Sheet name" }, values: { type: "string", description: "Comma-separated values", required: true } }, examplePrompts: ["add a row to my sheet"] },
    ],
    oauthUrl: getGoogleOAuthUrl,
};
