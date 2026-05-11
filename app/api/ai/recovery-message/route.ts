import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { getBusinessSystemPrompt } from "@/lib/businessContext";
import { cancellationRecoveryPrompt } from "@/lib/messageRecipes";
import { createLogger, genRequestId } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const requestId = genRequestId();
  const log = createLogger({ requestId });

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
      cancellationRecoveryPrompt({
        clientName: body.clientName,
        service: body.service,
        appointmentTime: body.appointmentTime,
        reason: body.reason,
      }),
      systemPrompt,
      { label: "cancellation_recovery", requestId }
    );

    return NextResponse.json({ message });
  } catch (error) {
    log.error("Failed to generate recovery message", { error: String(error) });
    return NextResponse.json({ error: "Failed to generate recovery message" }, { status: 500 });
  }
}
