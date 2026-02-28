import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// Provide a dummy URL at build time if env variables are missing to prevent Next.js from crashing
// Note: You MUST set these environment variables in Render for the app to function properly!
if (!supabaseUrl) {
    console.warn("Missing NEXT_PUBLIC_SUPABASE_URL environment variable.");
}

// Client-side Supabase client (uses anon key — safe for browser)
export const supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder"
);

// Types matching our DB schema
export interface DbConversation {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
}

export interface DbMessage {
    id: string;
    conversation_id: string;
    sender: "user" | "vynthen";
    content: string;
    created_at: string;
}
