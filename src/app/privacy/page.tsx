export default function PrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-stone-950">
      <div className="mx-auto max-w-lg px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Privacy Policy
        </h1>

        <div className="mt-8 space-y-6">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Information We Collect
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              We collect only the information necessary to provide our service.
              When you sign in with Google, we receive your name, email address,
              and profile photo. We also store the recipe URLs you submit for
              parsing and the extracted recipe data saved to your cookbook.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              How We Use Information
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Your data is used solely to operate and improve Mizen. We use
              recipe URLs to extract and display clean recipes, and account
              information to manage your saved cookbook. We do not sell your data
              to third parties.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Cookies
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              We use cookies to maintain your authentication session and remember
              your preferences. You can disable cookies through your browser
              settings, though this may affect your ability to use the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Data Retention
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              We retain your information only as long as needed to provide our
              service. You can delete your saved recipes at any time from your
              cookbook.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
