export const runtime = "edge";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  mode?: "chat" | "agent";
  isAgent?: boolean;
  webSearchOn?: boolean;
  connectedIntegrations?: string[];
}

const BASE_SYSTEM_PROMPT =
  'You are Vynthen, a highly intelligent, sharp, and capable AI assistant. You are direct, fast, and always helpful. You have two modes: Chat mode for conversation, Agent mode for breaking down and executing complex tasks step by step. Never mention you are built on Llama or Groq. You are Vynthen.';

function buildSystemPrompt(body: ChatRequestBody): string {
  const { mode, isAgent, webSearchOn, connectedIntegrations } = body;
  const integrationNote =
    connectedIntegrations && connectedIntegrations.length > 0
      ? ` The user has connected the following apps: ${connectedIntegrations.join(
        ", "
      )}. You can reference these when relevant.`
      : "";

  const webSearchNote = webSearchOn
    ? " The user may ask you to 'search the web'. You cannot actually browse, but you should simulate a confident, detailed, well structured web search with plausible cited sources and dates, clearly marked as simulated."
    : "";

  const modeNote =
    (mode === "agent" || isAgent)
      ? `\n\nAGENT MODE ACTIVE: You are operating as a high-speed, autonomous-like agent (similar to Z.ai). 
You MUST format your response into two distinct parts:
1. A fast, analytical thinking block at the top, showing your step-by-step reasoning or tool-use simulation. Use this EXACT format:
   \`\`\`thinking
   [Step 1...]
   [Step 2...]
   [Finalizing...]
   \`\`\`
2. Your actual final answer immediately below the closing backticks.

Be extremely fast, concise, and structured. Break down complex tasks ruthlessly.`
      : "";

  const imageGenNote = " If the user asks you to generate, create, draw, or imagine an image/picture, you MUST respond by returning a Markdown image using pollinations.ai. Format: `![Image Description](https://image.pollinations.ai/prompt/{url_encoded_detailed_prompt}?width=1024&height=1024&nologo=true)`. Replace {url_encoded_detailed_prompt} with a highly detailed, descriptive visual prompt of what they asked for, properly URL encoded. Do not say anything else, just return the markdown image.";

  return BASE_SYSTEM_PROMPT + integrationNote + webSearchNote + modeNote + imageGenNote;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as ChatRequestBody;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Request must include a messages array." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return new Response(
        JSON.stringify({
          error:
            "GROQ_API_KEY is not configured on the server. Please set it in .env.local."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = buildSystemPrompt(body);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt
      },
      ...body.messages
    ];

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages,
        stream: true,
        temperature: 0.4
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API error: ${response.status} ${errorText}`);
    }

    // Return the response directly to stream it to the client
    return new Response(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });

  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected error in chat route.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

