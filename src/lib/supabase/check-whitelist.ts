import { createAdminClient } from "./admin";

/**
 * Check whether an email exists in the Supabase Auth user list (beta whitelist).
 * Fails closed: returns `false` when the admin client is unavailable or errors occur.
 */
export async function isEmailWhitelisted(email: string): Promise<boolean> {
  const supabase = createAdminClient();
  if (!supabase) return false;

  const normalised = email.toLowerCase();
  const PAGE_SIZE = 1000;
  let page = 1;

  // Paginate through all users to avoid the 1,000-user cap
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: PAGE_SIZE,
    });

    if (error) return false;

    if (data.users.some((u) => u.email?.toLowerCase() === normalised)) {
      return true;
    }

    // No more pages
    if (data.users.length < PAGE_SIZE) break;
    page++;
  }

  return false;
}
