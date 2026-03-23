interface ClaudeTextResponse {
  content?: Array<{ type: string; text?: string }>;
}

export async function generateClaudeMessage(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 300,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude request failed: ${response.status} ${errorText}`);
  }

  const payload = (await response.json()) as ClaudeTextResponse;
  const text = payload.content?.find((block) => block.type === "text")?.text?.trim();

  if (!text) throw new Error("Claude returned an empty message");
  return text;
}
