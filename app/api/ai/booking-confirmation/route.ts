import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessSystemPrompt } from "@/lib/businessContext";
import { bookingRequestAckPrompt } from "@/lib/messageRecipes";
import { createLogger, genRequestId } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = genRequestId();
  const log = createLogger({ requestId });

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
      bookingRequestAckPrompt({
        clientName: body.name,
        service: body.service,
        preferredDate: body.preferredDate,
        preferredTime: body.preferredTime,
      }),
      systemPrompt,
      { label: "booking_request_ack", requestId }
    );

    return NextResponse.json({ message });
  } catch (error) {
    log.error("Failed to generate confirmation", { error: String(error) });
    return NextResponse.json({ error: "Failed to generate confirmation message" }, { status: 500 });
  }
}
