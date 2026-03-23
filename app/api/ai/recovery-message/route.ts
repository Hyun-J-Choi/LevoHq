import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      clientName: string;
      service: string;
      appointmentTime: string;
      reason?: string | null;
    };

    const message = await generateClaudeMessage(
      `Write a concise personalized SMS to recover a cancelled appointment.
Client: ${body.clientName}
Service: ${body.service}
Original appointment: ${body.appointmentTime}
Cancellation reason: ${body.reason ?? "Not specified"}

Requirements:
- Use first name if possible from the client name.
- Mention the missed service naturally.
- Caring, premium, non-pushy tone.
- Include one concrete rebooking incentive.
- Keep it under 70 words and SMS-friendly.
- End with a direct rebooking CTA.`
    );

    return NextResponse.json({ message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate recovery message" }, { status: 500 });
  }
}
