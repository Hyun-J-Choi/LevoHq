import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      name: string;
      phone: string;
      email: string;
      service: string;
      preferredDate: string;
      preferredTime: string;
    };

    const supabase = createSupabaseServerClient();
    const requestedAt = new Date(`${payload.preferredDate}T${payload.preferredTime}:00`).toISOString();

    const phoneEq = `"${payload.phone.replace(/"/g, "")}"`;
    const emailEq = `"${payload.email.replace(/"/g, "")}"`;
    const { data: existingClient } = await supabase
      .from("clients")
      .select("id")
      .or(`phone.eq.${phoneEq},email.eq.${emailEq}`)
      .limit(1)
      .maybeSingle();

    let clientId = existingClient?.id;

    if (!clientId) {
      const { data: insertedClient, error: clientInsertError } = await supabase
        .from("clients")
        .insert({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          status: "Active",
        })
        .select("id")
        .single();

      if (clientInsertError) {
        return NextResponse.json({ error: clientInsertError.message }, { status: 500 });
      }

      clientId = insertedClient.id;
    } else {
      await supabase
        .from("clients")
        .update({
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
        })
        .eq("id", clientId);
    }

    const { error: appointmentError } = await supabase.from("appointments").insert({
      client_id: clientId,
      client_name: payload.name,
      client_phone: payload.phone,
      service: payload.service,
      appointment_time: requestedAt,
      status: "Confirmed",
    });

    if (appointmentError) {
      return NextResponse.json({ error: appointmentError.message }, { status: 500 });
    }

    const message = await generateClaudeMessage(
      `Write a personalized premium appointment confirmation SMS.
Client: ${payload.name}
Service: ${payload.service}
Time: ${payload.preferredDate} at ${payload.preferredTime}

Requirements:
- Keep it under 60 words.
- Warm, luxe, and concise.
- Confirm the exact service/time and include one preparation tip.
- End with a clear way to reschedule if needed.`
    );

    return NextResponse.json({ ok: true, message });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Invalid booking payload" }, { status: 400 });
  }
}
