import { NextRequest, NextResponse } from "next/server";
import { DEMO_CHAT_SYSTEM_PROMPT } from "@/lib/demoChatSystemPrompt";

export const dynamic = "force-dynamic";

type DemoChatMessage = { role: "user" | "assistant"; content: string };

function isDemoChatMessage(m: unknown): m is DemoChatMessage {
  if (!m || typeof m !== "object") return false;
  const o = m as Record<string, unknown>;
  const role = o.role;
  const content = o.content;
  if (role !== "user" && role !== "assistant") return false;
  return typeof content === "string" && content.trim().length > 0;
}

export async function POST(request: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Anthropic API is not configured." },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("messages" in body)) {
    return NextResponse.json(
      { error: "Expected JSON object with a messages array." },
      { status: 400 }
    );
  }

  const raw = (body as { messages: unknown }).messages;
  if (!Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json(
      { error: "messages must be a non-empty array." },
      { status: 400 }
    );
  }

  const messages: DemoChatMessage[] = [];
  for (const item of raw) {
    if (!isDemoChatMessage(item)) {
      return NextResponse.json(
        {
          error:
            "Each message must be { role: 'user' | 'assistant', content: string } with non-empty content.",
        },
        { status: 400 }
      );
    }
    messages.push({
      role: item.role,
      content: item.content.trim(),
    });
  }

  if (messages[messages.length - 1]?.role !== "user") {
    return NextResponse.json(
      { error: "The last message must have role user." },
      { status: 400 }
    );
  }

  const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: DEMO_CHAT_SYSTEM_PROMPT,
      messages,
    }),
  });

  const payload = (await anthropicRes.json()) as {
    content?: Array<{ type: string; text?: string }>;
    error?: { message?: string };
  };

  if (!anthropicRes.ok) {
    const msg =
      payload.error?.message ??
      `Claude request failed with status ${anthropicRes.status}.`;
    return NextResponse.json(
      { error: msg },
      { status: anthropicRes.status >= 500 ? 502 : 400 }
    );
  }

  const text = payload.content
    ?.find((b) => b.type === "text")
    ?.text?.trim();

  if (!text) {
    return NextResponse.json(
      { error: "The model returned an empty reply." },
      { status: 502 }
    );
  }

  return NextResponse.json({ text });
}
