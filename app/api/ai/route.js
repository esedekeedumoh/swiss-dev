import { NextResponse } from "next/server";
import {
    chatSession,
    GenAiCode,
    enhancePromptSession,
} from "@/configs/AiModel";

export async function POST(req) {
    try {
        const body = await req.json();
        const { message, mode = "chat" } = body || {};

        if (!message || typeof message !== "string") {
            return NextResponse.json(
                { error: "message is required and must be a string" },
                { status: 400 }
            );
        }

        const session =
            mode === "code"
                ? GenAiCode
                : mode === "enhance"
                ? enhancePromptSession
                : chatSession;

        const result = await session.sendMessage(message);
        const reply =
            typeof result?.response?.text === "function"
                ? result.response.text()
                : "";

        return NextResponse.json({ reply });
    } catch (error) {
        return NextResponse.json(
            { error: error?.message || "Failed to generate response" },
            { status: 500 }
        );
    }
}

