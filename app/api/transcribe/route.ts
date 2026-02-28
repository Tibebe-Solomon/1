import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get("file");

        if (!file) {
            return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
        }

        const groqKey = process.env.GROQ_API_KEY;
        if (!groqKey) {
            return NextResponse.json(
                { error: "GROQ_API_KEY not set" },
                { status: 500 }
            );
        }

        const groqFormData = new FormData();
        groqFormData.append("file", file);
        groqFormData.append("model", "whisper-large-v3-turbo");
        groqFormData.append("temperature", "0");
        groqFormData.append("response_format", "verbose_json");

        const response = await fetch(
            "https://api.groq.com/openai/v1/audio/transcriptions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${groqKey}`,
                },
                body: groqFormData,
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return NextResponse.json({ text: data.text });
    } catch (error) {
        console.error("Transcription error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
