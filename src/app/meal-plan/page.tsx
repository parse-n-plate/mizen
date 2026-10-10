import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MealPlan } from "@/components/MealPlan";

export default async function MealPlanPage() {
  const client = await createClient();
  if (!client) redirect("/?signin=1");
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  // Data requests still validate the account. Keep connection failures on this view.
  if (isAuthRetryableFetchError(error)) return <MealPlan />;
  if (!user) redirect("/?signin=1");
  return <MealPlan />;
}
