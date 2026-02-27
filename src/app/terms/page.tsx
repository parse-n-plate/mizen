export default function TermsPage() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-white dark:bg-stone-950">
      <div className="mx-auto max-w-lg px-6 py-8">
        <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">
          Terms of Use
        </h1>

        <div className="mt-8 space-y-6">
          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Terms
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              By accessing Mizen, you agree to be bound by these terms of use.
              If you do not agree with any part of these terms, please do not use
              the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Use of the Service
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              You agree to use Mizen only for lawful purposes. You are
              responsible for the URLs you submit and any content generated from
              them. Do not use the service to extract or redistribute content in
              ways that violate the rights of recipe authors or publishers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Accounts
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              You are responsible for maintaining the security of your account.
              Account information is provided through Google sign-in and should
              be kept accurate and up to date.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Termination
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              We may suspend or terminate your access to Mizen at any time,
              without prior notice, for conduct that we believe violates these
              terms or is harmful to the service.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-serif text-lg font-semibold text-stone-900 dark:text-stone-100">
              Changes
            </h2>
            <p className="font-sans text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              We reserve the right to update these terms at any time. Continued
              use of Mizen after changes constitutes acceptance of the revised
              terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
