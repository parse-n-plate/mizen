import SearchForm from "@/components/ui/search-form"

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <main className="flex flex-col items-center justify-center">
        <div className="text-center mb-12" id="content-title">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What are you whipping up in your kitchen today?</h1>
          <h3 className="text-lg text-gray-500">Clean, ad-free recipes from any cooking website</h3>
        </div>
        <SearchForm/>
      </main>
      <footer className="flex items-center justify-center">
        FOOTER CONTENT HERE
      </footer>
    </div>
  );
}
