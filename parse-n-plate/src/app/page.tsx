"use client"

import SearchForm from "@/components/ui/search-form"
import {useState} from "react";
import {Alert, AlertTitle} from "@/components/ui/alert";
import {CircleAlert} from "lucide-react";

export default function Home() {
  const [error, setError] = useState(false);
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      {error && <Alert variant={"destructive"} className="bg-red-100 text-red-800 border border-red-300 mb-10">
        <AlertTitle className="flex flex-row">
            <CircleAlert className="mr-2"/>
            <p className="font-bold pt-0.5 pl-2">
              Hmm... That URL doesn’t look right.
            </p>
        </AlertTitle>
      </Alert>}
      <main className="flex flex-col items-center justify-center">
        <div className="text-center mb-12" id="content-title">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">What are you whipping up in your kitchen today?</h1>
          <h3 className="text-lg text-gray-500">Clean, ad-free recipes from any cooking website</h3>
        </div>
        <SearchForm setError={setError}/>
      </main>
      <footer className="flex items-center justify-center">
        FOOTER CONTENT HERE
      </footer>
    </div>
  );
}
