import { NextResponse } from "next/server";
import { buildPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
    try {
        const { transcript } = await req.json();

        const response = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama3.2",
                prompt: buildPrompt(transcript),
                stream: false
            })
        });

        const data = await response.json();

        const parsed = JSON.parse(data.response);

        return NextResponse.json(parsed);

    } catch (error) {
        return NextResponse.json(
            { error: "Analysis failed" },
            { status: 500 }
        );
    }
}