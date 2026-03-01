import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    return NextResponse.json({
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
        },
        github: {
            clientId: process.env.GITHUB_CLIENT_ID || "",
        }
    });
}
