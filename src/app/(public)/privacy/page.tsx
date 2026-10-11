import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy policy | Mizen",
  description: "How Mizen collects, uses, and retains your information.",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <div className="mt-8 space-y-6">
        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            Information we collect
          </h2>
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-400">
            We collect only the information necessary to provide our service. When you sign in with
            Google, we receive your name, email address, and profile photo. We also store the recipe
            URLs you submit for parsing and the extracted recipe data saved to your cookbook.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            How we use information
          </h2>
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-400">
            Your data is used solely to operate and improve Mizen. We use recipe URLs to extract and
            display clean recipes, and account information to manage your saved cookbook. We do not
            sell your data to third parties.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            Cookies
          </h2>
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-400">
            We use cookies to maintain your authentication session and remember your preferences.
            You can disable cookies through your browser settings, though this may affect your
            ability to use the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
            Data retention
          </h2>
          <p className="font-sans text-base leading-relaxed text-stone-600 dark:text-stone-400">
            We retain your information only as long as needed to provide our service. You can delete
            your saved recipes at any time from your cookbook.
          </p>
        </section>
      </div>
    </LegalPage>
  );
}
