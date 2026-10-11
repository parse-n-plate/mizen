export default function PublicPageLoading() {
  return (
    <main
      aria-busy="true"
      className="mx-auto w-full max-w-[1120px] flex-1 px-5 py-10 sm:px-8 sm:py-14"
    >
      <p role="status" className="font-sans text-sm text-stone-500 dark:text-stone-400">
        Loading page…
      </p>
    </main>
  );
}
