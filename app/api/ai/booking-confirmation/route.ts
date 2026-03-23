import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      name: string;
      service: string;
      preferredDate: string;
      preferredTime: string;
    };

    const message = await generateClaudeMessage(
      `Write a premium, warm confirmation message for a beauty/wellness client.
Client name: ${body.name}
Service: ${body.service}
Preferred date: ${body.preferredDate}
Preferred time: ${body.preferredTime}

Keep it to 3-4 sentences, personal, concise, and luxurious in tone. Include next steps and appreciation.`
    );

    return NextResponse.json({ message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to generate confirmation message" }, { status: 500 });
  }
}
