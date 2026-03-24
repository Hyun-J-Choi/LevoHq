import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessSystemPrompt } from "@/lib/businessContext";
import { createLogger, genRequestId } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const log = createLogger({ requestId: genRequestId() });

  try {
    const body = (await request.json()) as {
      clientName: string;
      service: string;
      appointmentTime: string;
      reason?: string | null;
      businessId?: string;
    };

    const systemPrompt = body.businessId
      ? await getBusinessSystemPrompt(body.businessId)
      : undefined;

    log.info("Generating recovery message", { businessId: body.businessId });

    const message = await generateClaudeMessage(
      `Write a concise personalized SMS to recover a cancelled appointment.
Client: ${body.clientName}
Service: ${body.service}
Original appointment: ${body.appointmentTime}
Cancellation reason: ${body.reason ?? "Not specified"}

Requirements:
- Use first name if possible from the client name.
- Mention the missed service naturally.
- Caring, non-pushy tone matching the brand voice.
- Include one concrete rebooking incentive.
- Keep it under 70 words and SMS-friendly.
- End with a direct rebooking CTA.`,
      systemPrompt
    );

    return NextResponse.json({ message });
  } catch (error) {
    log.error("Failed to generate recovery message", { error: String(error) });
    return NextResponse.json({ error: "Failed to generate recovery message" }, { status: 500 });
  }
}
