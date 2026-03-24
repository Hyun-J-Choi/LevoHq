import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { email, password, businessName, ownerName } = await req.json();

  if (!email || !password || !businessName || !ownerName) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  const admin = createSupabaseAdmin();

  // 1. Create auth user (auto-confirm for immediate login)
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message ?? "Failed to create account." },
      { status: 400 }
    );
  }

  const userId = authData.user.id;

  // 2. Create business
  const { data: business, error: bizError } = await admin
    .from("businesses")
    .insert({ name: businessName, owner_name: ownerName, email })
    .select("id")
    .single();

  if (bizError || !business) {
    // Rollback: delete the auth user
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to create business: " + (bizError?.message ?? "unknown") },
      { status: 500 }
    );
  }

  // 3. Link user to business
  const { error: linkError } = await admin.from("business_users").insert({
    user_id: userId,
    business_id: business.id,
    role: "owner",
  });

  if (linkError) {
    // Rollback
    await admin.from("businesses").delete().eq("id", business.id);
    await admin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to link account: " + linkError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ businessId: business.id });
}
