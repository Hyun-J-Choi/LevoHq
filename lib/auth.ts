import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns the business_id for the currently authenticated user.
 * Throws if not authenticated or no business membership found.
 */
export async function getCurrentBusinessId(
  supabase: SupabaseClient
): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("business_users")
    .select("business_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error || !data) {
    throw new Error("No business membership found");
  }

  return data.business_id;
}

/**
 * Returns user + business info, or null if not authenticated.
 */
export async function getAuthContext(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: membership } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!membership) return null;

  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", membership.business_id)
    .single();

  return {
    user,
    businessId: membership.business_id,
    role: membership.role as "owner" | "admin" | "staff",
    business,
  };
}
