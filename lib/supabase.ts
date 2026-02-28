import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side Supabase client (uses anon key — safe for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
