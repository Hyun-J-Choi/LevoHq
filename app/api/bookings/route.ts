import { NextRequest, NextResponse } from "next/server";
import { generateClaudeMessage } from "@/lib/claude";
import { normalizeToE164 } from "@/lib/phone";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as {
      name: string;
      phone: string;
      email?: string;
      service: string;
      /** ISO 8601 from client (local wall time encoded as instant). */
      preferredDateTime?: string;
      clientTimeZone?: string;
      preferredDate?: string;
      preferredTime?: string;
    };

    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    const rawPhone = typeof payload.phone === "string" ? payload.phone.trim() : "";
    const phone = normalizeToE164(rawPhone) ?? rawPhone;
    const service = typeof payload.service === "string" ? payload.service.trim() : "";
    const preferredDateTimeRaw =
      typeof payload.preferredDateTime === "string" ? payload.preferredDateTime.trim() : "";
    const preferredDate = typeof payload.preferredDate === "string" ? payload.preferredDate.trim() : "";
    const preferredTime = typeof payload.preferredTime === "string" ? payload.preferredTime.trim() : "";
    const clientTimeZone =
      typeof payload.clientTimeZone === "string" && payload.clientTimeZone.trim()
        ? payload.clientTimeZone.trim()
        : undefined;

    if (!name || !phone || !service) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    let requestedAt: string;
    let timeForSms: string;

    if (preferredDateTimeRaw) {
      const dt = new Date(preferredDateTimeRaw);
      if (Number.isNaN(dt.getTime())) {
        return NextResponse.json({ error: "Invalid preferredDateTime" }, { status: 400 });
      }
      requestedAt = dt.toISOString();
      timeForSms = clientTimeZone
        ? dt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short", timeZone: clientTimeZone })
        : dt.toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });
    } else if (preferredDate && preferredTime) {
      const dt = new Date(`${preferredDate}T${preferredTime}:00`);
      if (Number.isNaN(dt.getTime())) {
        return NextResponse.json({ error: "Invalid date or time" }, { status: 400 });
      }
      requestedAt = dt.toISOString();
      timeForSms = `${preferredDate} at ${preferredTime}`;
    } else {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: existingClient } = await supabase.from("clients").select("id").eq("phone", phone).maybeSingle();

    let clientId = existingClient?.id;

    if (!clientId) {
      const email = typeof payload.email === "string" && payload.email.trim() ? payload.email.trim() : null;
      const insertRow: Record<string, string | null> = {
        name,
        phone,
        status: "Active",
      };
      if (email) insertRow.email = email;

      const { data: insertedClient, error: clientInsertError } = await supabase
        .from("clients")
        .insert(insertRow)
        .select("id")
        .single();

      if (clientInsertError) {
        return NextResponse.json({ error: clientInsertError.message }, { status: 500 });
      }

      clientId = insertedClient.id;
    } else {
      const updateRow: Record<string, string> = { name, phone };
      if (typeof payload.email === "string" && payload.email.trim()) {
        updateRow.email = payload.email.trim();
      }
      await supabase.from("clients").update(updateRow).eq("id", clientId);
    }

    const { error: appointmentError } = await supabase.from("appointments").insert({
      client_id: clientId,
      client_name: name,
      client_phone: phone,
      service,
      appointment_time: requestedAt,
      status: "Confirmed",
    });

    if (appointmentError) {
      return NextResponse.json({ error: appointmentError.message }, { status: 500 });
    }

    const message = await generateClaudeMessage(
      `Write a personalized premium appointment confirmation SMS.
Client: ${name}
Service: ${service}
Time: ${timeForSms}

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
