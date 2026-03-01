import { tavily } from "@tavily/core";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const { query } = await req.json() as { query: string };

        if (!query?.trim()) {
            return Response.json({ error: "No query provided" }, { status: 400 });
        }

        const apiKey = process.env.TAVILY_API_KEY;
        if (!apiKey) {
            return Response.json({ error: "TAVILY_API_KEY not configured" }, { status: 500 });
        }

        const client = tavily({ apiKey });

        const result = await client.search(query, {
            searchDepth: "advanced",
            maxResults: 5,
            includeAnswer: true,
        });

        // Return clean structured data
        const sources = (result.results ?? []).map((r: { title?: string; url?: string; content?: string }) => ({
            title: r.title ?? "",
            url: r.url ?? "",
            snippet: r.content ?? "",
        }));

        return Response.json({
            answer: result.answer ?? null,
            sources,
            query,
        });
    } catch (err) {
        console.error("[/api/search] Error:", err);
        return Response.json({ error: "Search failed" }, { status: 500 });
    }
}
