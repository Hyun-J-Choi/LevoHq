import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessSystemPrompt } from "@/lib/businessContext";
import { createLogger, genRequestId } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const log = createLogger({ requestId: genRequestId() });

  try {
    const body = (await request.json()) as {
      name: string;
      service: string;
      preferredDate: string;
      preferredTime: string;
      businessId?: string;
    };

    const systemPrompt = body.businessId
      ? await getBusinessSystemPrompt(body.businessId)
      : undefined;

    log.info("Generating booking confirmation", { businessId: body.businessId });

    const message = await generateClaudeMessage(
      `Write a confirmation message for a client booking request.
Client name: ${body.name}
Service: ${body.service}
Preferred date: ${body.preferredDate}
Preferred time: ${body.preferredTime}

Keep it to 3-4 sentences, personal, concise, and warm. Include next steps and appreciation. Stay under 280 characters for SMS.`,
      systemPrompt
    );

    return NextResponse.json({ message });
  } catch (error) {
    log.error("Failed to generate confirmation", { error: String(error) });
    return NextResponse.json({ error: "Failed to generate confirmation message" }, { status: 500 });
  }
}
