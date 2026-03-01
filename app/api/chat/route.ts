import Groq from "groq-sdk";
import { createClient } from "@supabase/supabase-js";

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
  personality?: string;
  instructions?: string;
  language?: string;
  // Phase 1 new params
  voice?: string;       // professional | casual | enthusiastic | funny
  depth?: string;       // precise | balanced | creative
  focus?: string;       // default | web | code | writing | math | creative
  skill?: string;       // none | code | write | research | analyze | coach
  duality?: boolean;    // two answers: polished + raw
  echo?: boolean;       // auto-detect language, reply in same
  pulse?: boolean;      // detect mood, adjust warmth
  userId?: string;      // Passed from frontend if logged in
}

const PERSONALITY_NOTES: Record<string, string> = {
  balanced: "",
  concise: " Be extremely concise. Give short, direct answers with no filler or excess explanation.",
  detailed: " Be thorough and detailed. Explain every important aspect clearly and completely.",
  creative: " Be imaginative, expressive, and inventive. Use vivid language and creative thinking.",
  formal: " Maintain a formal, professional tone at all times. Use structured, precise language.",
};

const VOICE_NOTES: Record<string, string> = {
  professional: " Use a formal, polished, professional communication style.",
  casual: "",
  enthusiastic: " Be highly enthusiastic, energetic, and encouraging. Use exclamation points strategically!",
  funny: " Be witty and humorous. Use clever wordplay, friendly jokes, and light sarcasm where appropriate.",
};

const DEPTH_NOTES: Record<string, string> = {
  precise: " Be extremely precise, factual, and conservative. Stick strictly to what you know. Avoid speculation.",
  balanced: "",
  creative: " Be imaginative and creative in your reasoning. Explore possibilities, make connections, be inventive.",
};

const FOCUS_NOTES: Record<string, string> = {
  default: "",
  web: " The user is asking about current events or web-based information. Simulate a thorough, well-cited web search response.",
  code: " The user is asking about code or programming. Be a senior software engineer. Provide clean, elegant, working code with brief explanations.",
  writing: " The user wants writing help. Be a skilled author. Focus on clarity, flow, tone, and impact.",
  math: " The user needs mathematical help. Be a mathematician. Show your work clearly, step-by-step, with formulas.",
  creative: " The user wants creative output. Be a creative director. Think boldly, make unexpected connections, surprise them.",
};

const SKILL_NOTES: Record<string, string> = {
  none: "",
  code: " @code skill ACTIVE: You are now operating as an elite software engineer. Write production-quality, well-commented code. Lead with code, explain after.",
  write: " @write skill ACTIVE: You are now a professional writer and editor. Focus entirely on compelling prose, structure, and impact.",
  research: " @research skill ACTIVE: You are now a research analyst. Provide deep, well-structured research with sources, context, and analysis.",
  analyze: " @analyze skill ACTIVE: You are now a data analyst and critical thinker. Break down the problem logically, identify patterns, and draw clear conclusions.",
  coach: " @coach skill ACTIVE — GUIDE MODE: You are now a Socratic life coach. Do NOT give direct answers. Instead, ask powerful, thoughtful questions that help the user discover insights themselves. Be warm, curious, and non-judgmental.",
};

const BASE_SYSTEM_PROMPT =
  'You are Vynthen, a highly intelligent, sharp, and capable AI assistant. You are direct, fast, and always helpful. You have two modes: Chat mode for conversation, Agent mode for breaking down and executing complex tasks step by step. Never mention you are built on Llama or Groq. You are Vynthen.';

function buildSystemPrompt(body: ChatRequestBody, userMemories: string[] = []): string {
  const {
    mode, isAgent, webSearchOn, connectedIntegrations,
    personality, instructions, language,
    voice, depth, focus, skill, duality, echo, pulse, userId
  } = body;

  const integrationNote = connectedIntegrations?.length
    ? ` The user has connected: ${connectedIntegrations.join(", ")}. Reference these when relevant.`
    : "";

  const webSearchNote = webSearchOn
    ? " Simulate a confident, detailed web search with plausible cited sources when asked, clearly marked as simulated."
    : "";

  const personalityNote = PERSONALITY_NOTES[personality ?? "balanced"] ?? "";
  const voiceNote = VOICE_NOTES[voice ?? "casual"] ?? "";
  const depthNote = DEPTH_NOTES[depth ?? "balanced"] ?? "";
  const focusNote = FOCUS_NOTES[focus ?? "default"] ?? "";
  const skillNote = SKILL_NOTES[skill ?? "none"] ?? "";

  const instructionsNote = instructions?.trim()
    ? ` CUSTOM INSTRUCTIONS (obey always): "${instructions.trim()}"`
    : "";

  // Single, absolute language directive — always applied, covers English too
  const LANG_NAMES: Record<string, string> = {
    en: "English", zh: "Mandarin Chinese", es: "Spanish", hi: "Hindi",
    ar: "Arabic", fr: "French", pt: "Portuguese", ru: "Russian",
    bn: "Bengali", ja: "Japanese", am: "Amharic", om: "Oromo",
    sw: "Swahili", ha: "Hausa", yo: "Yoruba", de: "German",
    tr: "Turkish", ko: "Korean", it: "Italian", fa: "Persian (Farsi)",
    pa: "Punjabi", ur: "Urdu", vi: "Vietnamese", th: "Thai",
    tl: "Tagalog (Filipino)", ms: "Malay / Indonesian", nl: "Dutch",
    el: "Greek", so: "Somali", ti: "Tigrinya",
  };
  const langName = LANG_NAMES[language ?? "en"] ?? "English";
  const languageNote = ` ABSOLUTE LANGUAGE RULE: You MUST respond ENTIRELY in ${langName} (${language ?? "en"}). Every single word of your response — including sparks questions, thinking blocks, labels, and headers — must be in ${langName}. Do NOT mix in any other language under any circumstances.`;

  // Echo note is a separate opt-in feature unrelated to language setting
  const echoNote = echo
    ? " ECHO MODE: Detect the user's input language and mirror it exactly. (Overrides the language rule above only if Echo is explicitly enabled.)"
    : "";

  const pulseNote = pulse
    ? " PULSE MODE: Carefully detect the emotional tone of the user's message. If they seem stressed, be calming and supportive. If excited, match their energy. If confused, be patient and clear. Subtly adapt your warmth accordingly."
    : "";

  const dualityNote = duality
    ? `\n\nDUALITY MODE ACTIVE: You MUST provide two versions of your answer, clearly separated:
## ✦ Polished
[A well-crafted, safe, professional answer]

## ⚡ Raw
[The same answer but brutally honest, unfiltered, and direct — no sugarcoating]`
    : "";

  const agentNote = (mode === "agent" || isAgent)
    ? `\n\nAGENT MODE ACTIVE: You are operating as a highly proactive, analytical, and structured agent.
Do NOT just give a flat answer or immediately dump code without understanding the full scope.
You MUST:
1. First, think step-by-step in a hidden \`\`\`thinking\`\`\` block. Analyze constraints, goals, and missing info.
2. If the user's request is ambiguous, broad, or lacks crucial details, ASK targeted clarifying questions at the end of your responseBEFORE committing to a final solution.
3. Structure your response clearly using headers (##), bold text, and bullet points. Make it extremely readable.
Format:
\`\`\`thinking
[Analyze request...]
[Determine if questions are needed...]
\`\`\`
Your highly formatted, bulleted response here. End with questions if you need clarification.`
    : "";

  const memoryNote = userId
    ? `\n\nCORE MEMORY ACTIVE. Here is what you currently know about the user:\n${userMemories.map(m => `- ${m}`).join("\n")}\nIf the user tells you a new fact about themselves (preferences, details, background), you MUST remember it by returning a special block exactly like this:\n[[remember: [fact here]]]\nBe proactive in remembering important details.`
    : "";

  const sparksNote = ` After every response, add a hidden block at the very end:\n\`\`\`sparks\n[Question 1?]\n[Question 2?]\n[Question 3?]\n[Question 4?]\n\`\`\`\nThese are 4 short, clickable follow-up questions the user might want to ask next. Make them genuinely useful and relevant.`;

  const imageGenNote = " For image requests: `![Description](fal-image:detailed prompt)`. For video: `![Description](fal-video:detailed prompt)`.";

  return BASE_SYSTEM_PROMPT
    + personalityNote + voiceNote + depthNote + focusNote + skillNote
    + instructionsNote + languageNote + echoNote + pulseNote
    + integrationNote + webSearchNote + memoryNote
    + agentNote + dualityNote
    + sparksNote + imageGenNote;
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as ChatRequestBody;

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(JSON.stringify({ error: "Request must include a messages array." }), {
        status: 400, headers: { "Content-Type": "application/json" }
      });
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      return new Response(JSON.stringify({ error: "GROQ_API_KEY is not configured." }), {
        status: 500, headers: { "Content-Type": "application/json" }
      });
    }

    // Initialize admin Supabase client for backend operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    let userMemories: string[] = [];
    let supabase: ReturnType<typeof createClient> | null = null;

    if (supabaseUrl && supabaseServiceKey && body.userId) {
      supabase = createClient(supabaseUrl, supabaseServiceKey);
      // Cast the result to any[] to bypass generic type complaining about 'content'
      const { data } = await supabase.from("memories").select("content").eq("user_id", body.userId);
      if (data) {
        userMemories = (data as any[]).map(m => m.content as string);
      }
    }

    const systemPrompt = buildSystemPrompt(body, userMemories);
    const messages: ChatMessage[] = [{ role: "system", content: systemPrompt }, ...body.messages];

    const groq = new Groq({ apiKey: groqKey });

    // Adjust temperature based on depth
    const depthTemp: Record<string, number> = { precise: 0.1, balanced: 0.4, creative: 0.85 };
    const temperature = depthTemp[body.depth ?? "balanced"] ?? 0.4;

    const chatCompletion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: messages as any[],
      stream: true,
      temperature,
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";
        try {
          for await (const chunk of chatCompletion) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }

          // Post-process: check if AI decided to remember something
          if (supabase && body.userId) {
            const memoryRegex = /\[\[remember:\s*(.+?)\]\]/g;
            let match;
            while ((match = memoryRegex.exec(fullResponse)) !== null) {
              const fact = match[1].trim();
              if (fact) {
                // Ignore TS error for the dynamic table name in generic client
                await (supabase.from("memories") as any).insert({
                  user_id: body.userId,
                  content: fact
                });
              }
            }
          }

        } catch (err) {
          console.error("Stream error:", err);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { "Content-Type": "application/json" }
    });
  }
}
