// ── Vynthen Integrations — GitHub ─────────────────────────────────────────

import type { Integration, ActionContext, ActionResult } from "./types";
import { integrationConfig } from "./config";
import { logActivity } from "./activityLog";

export function getGitHubOAuthUrl(state: string): string {
    const scopes = "repo gist read:user";
    const params = new URLSearchParams({
        client_id: integrationConfig.github.clientId!,
        redirect_uri: integrationConfig.github.redirectUri,
        scope: scopes,
        state,
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

async function githubFetch(ctx: ActionContext, path: string, options: RequestInit = {}): Promise<Response> {
    return fetch(`https://api.github.com${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${ctx.accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "Content-Type": "application/json",
            ...(options.headers ?? {}),
        },
    });
}

// ── Action Runners ────────────────────────────────────────────────────────

async function listRepos(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const res = await githubFetch(ctx, `/user/repos?per_page=${params.limit ?? 10}&sort=updated`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
    const json = await res.json() as { name: string; full_name: string; private: boolean; stargazers_count: number }[];
    const lines = json.map((r) => `• ${r.full_name} ⭐${r.stargazers_count} ${r.private ? "(private)" : "(public)"}`);
    const text = `INTEGRATION RESULT — GitHub — listRepos:\n${lines.join("\n")}`;
    await logActivity({ userId: ctx.userId, integrationId: "github", action: "listRepos", riskLevel: "low", resultSummary: `Listed ${lines.length} repos`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function readRepoFile(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { owner, repo, path } = params;
    const res = await githubFetch(ctx, `/repos/${owner}/${repo}/contents/${path}`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
    const json = await res.json() as { content?: string; name?: string };
    const content = json.content ? Buffer.from(json.content, "base64").toString("utf8") : "(binary file)";
    const preview = content.slice(0, 500);
    const text = `INTEGRATION RESULT — GitHub — readRepoFile:\nFile: ${json.name}\n\`\`\`\n${preview}${content.length > 500 ? "\n… (truncated)" : ""}\n\`\`\``;
    await logActivity({ userId: ctx.userId, integrationId: "github", action: "readRepoFile", riskLevel: "low", resultSummary: `Read ${path} from ${owner}/${repo}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function createIssue(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { owner, repo, title, body } = params;
    const res = await githubFetch(ctx, `/repos/${owner}/${repo}/issues`, {
        method: "POST",
        body: JSON.stringify({ title, body }),
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
    const json = await res.json() as { number?: number; html_url?: string };
    const text = `INTEGRATION RESULT — GitHub — createIssue:\nIssue #${json.number} created: ${json.html_url}`;
    await logActivity({ userId: ctx.userId, integrationId: "github", action: "createIssue", riskLevel: "medium", resultSummary: `Created issue #${json.number} in ${owner}/${repo}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function createGist(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { filename, content, description } = params;
    const files: Record<string, { content: string }> = {};
    files[filename ?? "vynthen.md"] = { content };
    const res = await githubFetch(ctx, "/gists", {
        method: "POST",
        body: JSON.stringify({ description: description ?? "Created by Vynthen", public: false, files }),
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
    const json = await res.json() as { html_url?: string; id?: string };
    const text = `INTEGRATION RESULT — GitHub — createGist:\nGist created: ${json.html_url}`;
    await logActivity({ userId: ctx.userId, integrationId: "github", action: "createGist", riskLevel: "medium", resultSummary: `Gist created: ${json.id}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function listPRs(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { owner, repo } = params;
    const res = await githubFetch(ctx, `/repos/${owner}/${repo}/pulls?state=open&per_page=10`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
    const json = await res.json() as { number: number; title: string; user: { login: string }; html_url: string }[];
    const lines = json.map((pr) => `• PR #${pr.number}: "${pr.title}" by @${pr.user.login} — ${pr.html_url}`);
    const text = `INTEGRATION RESULT — GitHub — listPRs:\n${lines.join("\n") || "No open PRs."}`;
    await logActivity({ userId: ctx.userId, integrationId: "github", action: "listPRs", riskLevel: "low", resultSummary: `Listed ${lines.length} PRs in ${owner}/${repo}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function repoStats(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { owner, repo } = params;
    const res = await githubFetch(ctx, `/repos/${owner}/${repo}`);
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
    const json = await res.json() as { full_name: string; stargazers_count: number; forks_count: number; open_issues_count: number; language: string; description: string };
    const text = `INTEGRATION RESULT — GitHub — repoStats:\n• Repo: ${json.full_name}\n• ⭐ Stars: ${json.stargazers_count}\n• 🍴 Forks: ${json.forks_count}\n• 🐛 Open Issues: ${json.open_issues_count}\n• Language: ${json.language}\n• Description: ${json.description}`;
    await logActivity({ userId: ctx.userId, integrationId: "github", action: "repoStats", riskLevel: "low", resultSummary: `Stats for ${owner}/${repo}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

async function pushFile(ctx: ActionContext, params: Record<string, string>): Promise<ActionResult> {
    const { owner, repo, path, content, message } = params;
    // Get current SHA if file exists
    let sha: string | undefined;
    const existing = await githubFetch(ctx, `/repos/${owner}/${repo}/contents/${path}`);
    if (existing.ok) {
        const json = await existing.json() as { sha?: string };
        sha = json.sha;
    }
    const encoded = Buffer.from(content).toString("base64");
    const body: Record<string, unknown> = { message: message ?? `Update ${path} via Vynthen`, content: encoded };
    if (sha) body.sha = sha;

    const res = await githubFetch(ctx, `/repos/${owner}/${repo}/contents/${path}`, {
        method: "PUT",
        body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.statusText}`);
    const text = `INTEGRATION RESULT — GitHub — pushFile:\nFile "${path}" pushed to ${owner}/${repo}.`;
    await logActivity({ userId: ctx.userId, integrationId: "github", action: "pushFile", riskLevel: "high", resultSummary: `Pushed ${path} to ${owner}/${repo}`, createdAt: new Date() });
    return { success: true, integrationResultText: text };
}

// ── Action Dispatcher ─────────────────────────────────────────────────────

const actionMap: Record<string, (ctx: ActionContext, params: Record<string, string>) => Promise<ActionResult>> = {
    listRepos,
    readRepoFile,
    createIssue,
    createGist,
    listPRs,
    repoStats,
    pushFile,
};

export async function runGitHubAction(
    action: string,
    ctx: ActionContext,
    params: Record<string, string>
): Promise<ActionResult> {
    const fn = actionMap[action];
    if (!fn) {
        return { success: false, error: `Unknown action: ${action}`, integrationResultText: `INTEGRATION RESULT — GitHub — Error: Unknown action "${action}"` };
    }
    if (!integrationConfig.github.configured) {
        return { success: false, error: "not_configured", integrationResultText: "Integration not configured yet." };
    }
    try {
        return await fn(ctx, params);
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logActivity({ userId: ctx.userId, integrationId: "github", action, riskLevel: "low", resultSummary: `Error: ${msg}`, createdAt: new Date() });
        return { success: false, error: msg, integrationResultText: `INTEGRATION RESULT — GitHub — Error: ${msg}` };
    }
}

// ── Integration Manifest ──────────────────────────────────────────────────

export const githubIntegration: Integration = {
    id: "github",
    name: "GitHub",
    description: "Manage repos, issues, PRs, gists, and files",
    icon: "⚫",
    category: "Development",
    requiresAuth: true,
    authType: "oauth2",
    permissions: ["Read repos", "Create issues", "Push files", "Create gists"],
    intentKeywords: ["push this to github", "create an issue", "read my repo", "make a gist", "github", "repository", "pull request", "open pr", "repo stats"],
    actions: [
        { id: "listRepos", name: "List Repos", description: "List your GitHub repos", riskLevel: "low", inputSchema: { limit: { type: "number", description: "Max repos to show" } }, examplePrompts: ["show my repos", "list my github projects"] },
        { id: "readRepoFile", name: "Read File", description: "Read a file from a repo", riskLevel: "low", inputSchema: { owner: { type: "string", description: "Repo owner", required: true }, repo: { type: "string", description: "Repo name", required: true }, path: { type: "string", description: "File path", required: true } }, examplePrompts: ["read README from my repo"] },
        { id: "createIssue", name: "Create Issue", description: "Open a GitHub issue", riskLevel: "medium", inputSchema: { owner: { type: "string", description: "Repo owner", required: true }, repo: { type: "string", description: "Repo name", required: true }, title: { type: "string", description: "Issue title", required: true }, body: { type: "string", description: "Issue body" } }, examplePrompts: ["create an issue for the bug I described"] },
        { id: "createGist", name: "Create Gist", description: "Create a GitHub Gist", riskLevel: "medium", inputSchema: { filename: { type: "string", description: "Filename", required: true }, content: { type: "string", description: "File content", required: true }, description: { type: "string", description: "Gist description" } }, examplePrompts: ["save this as a gist", "make a gist from this code"] },
        { id: "listPRs", name: "List PRs", description: "List open pull requests", riskLevel: "low", inputSchema: { owner: { type: "string", description: "Repo owner", required: true }, repo: { type: "string", description: "Repo name", required: true } }, examplePrompts: ["show open PRs", "list pull requests"] },
        { id: "repoStats", name: "Repo Stats", description: "Get stats for a repository", riskLevel: "low", inputSchema: { owner: { type: "string", description: "Repo owner", required: true }, repo: { type: "string", description: "Repo name", required: true } }, examplePrompts: ["show stats for my repo"] },
        { id: "pushFile", name: "Push File", description: "Push a file to a repo", riskLevel: "high", inputSchema: { owner: { type: "string", description: "Repo owner", required: true }, repo: { type: "string", description: "Repo name", required: true }, path: { type: "string", description: "File path", required: true }, content: { type: "string", description: "File content", required: true }, message: { type: "string", description: "Commit message" } }, examplePrompts: ["push this file to github"] },
    ],
    oauthUrl: getGitHubOAuthUrl,
};
