import { createAdminClient } from "./admin";

/**
 * Check whether an email exists in the Supabase Auth user list (beta whitelist).
 * Returns `true` when the admin client is unavailable (fail-open).
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return true;

  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (error) return true;

  const normalised = email.toLowerCase();
  return data.users.some((u) => u.email?.toLowerCase() === normalised);
}
