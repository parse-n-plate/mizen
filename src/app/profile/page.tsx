import Image from "next/image";
import { ProfileSettingsPanel } from "@/components/ProfileSettingsPanel";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
  if (!isSupabaseConfigured) {
    redirect("/");
  }

  let name = "User";
  let email = "";
  let avatarUrl: string | undefined;

  try {
    const supabase = await createClient();
    if (!supabase) {
      throw new Error("Supabase unavailable");
    }
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/");
    }

    name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
    email = user.email || "";
    avatarUrl = user.user_metadata?.avatar_url;
  } catch {
    redirect("/");
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="mx-auto max-w-lg px-6 py-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-full"
                unoptimized
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-stone-100 dark:bg-stone-800 font-serif text-2xl font-bold text-stone-600 dark:text-stone-300">
                {name[0]}
              </div>
            )}
            <div>
              <h1 className="font-serif text-2xl font-bold">{name}</h1>
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">{email}</p>
            </div>
          </div>

          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="font-sans text-sm text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 hover:underline"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50/90 px-4 py-3 dark:border-amber-900/70 dark:bg-amber-950/50">
          <p className="font-sans text-sm font-medium text-amber-900 dark:text-amber-100">
            Mizen is currently in beta.
          </p>
          <p className="mt-1 font-sans text-[13px] text-amber-800/90 dark:text-amber-200/80">
            You may notice changes across the app as we keep refining recipes, navigation, and
            account tools.
          </p>
        </div>

        <ProfileSettingsPanel />
      </div>
    </div>
  );
}
