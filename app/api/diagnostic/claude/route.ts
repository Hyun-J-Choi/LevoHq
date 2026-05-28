import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * One-off diagnostic endpoint to verify Claude API key + model env vars
 * are working in production. DELETE THIS FILE after the SMS pipeline is
 * confirmed healthy. Leaving it in is a minor info-leak surface.
 */
export async function GET() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = process.env.CLAUDE_MODEL ?? "claude-sonnet-4-6";

  const envCheck = {
    has_api_key: Boolean(apiKey),
    api_key_length: apiKey?.length ?? 0,
    api_key_prefix: apiKey?.slice(0, 7) ?? null,
    api_key_has_whitespace:
      apiKey !== undefined && apiKey !== apiKey.trim(),
    model_env_raw: process.env.CLAUDE_MODEL ?? null,
    model_resolved: model,
  };

  if (!apiKey) {
    return NextResponse.json(
      { ok: false, stage: "env_check", env: envCheck, error: "ANTHROPIC_API_KEY not set in runtime" },
      { status: 500 }
    );
  }

  const started = Date.now();
  let status: number | null = null;
  let bodyText: string | null = null;
  try {
    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 20,
        messages: [{ role: "user", content: "Reply with just the word OK." }],
      }),
    });
    status = resp.status;
    bodyText = await resp.text();
    const duration_ms = Date.now() - started;

    if (!resp.ok) {
      return NextResponse.json(
        {
          ok: false,
          stage: "anthropic_http",
          env: envCheck,
          http_status: status,
          duration_ms,
          response_body: bodyText.slice(0, 2000),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      ok: true,
      env: envCheck,
      http_status: status,
      duration_ms,
      response_body_preview: bodyText.slice(0, 500),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        stage: "fetch_threw",
        env: envCheck,
        error: err instanceof Error ? err.message : String(err),
        http_status: status,
        body_text: bodyText,
      },
      { status: 500 }
    );
  }
}
