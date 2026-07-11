import { SettingsPage } from "@/components/SettingsModal";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  if (!isSupabaseConfigured) redirect("/");

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase!.auth.getUser();

    if (!user) redirect("/");
  } catch {
    redirect("/");
  }

  return <SettingsPage />;
}
