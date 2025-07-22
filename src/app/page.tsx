'use client';

import SearchForm from '@/components/ui/search-form';
import RecentRecipesList from '@/components/RecentRecipesList';
import { useState } from 'react';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { CircleAlert } from 'lucide-react';

export default function Home() {
  const [error, setError] = useState(false);
  return (
    <div className="w-full max-w-4xl mx-auto px-6 py-16">
      {error && (
        <Alert
          variant={'destructive'}
          className="bg-red-100 text-red-800 border border-red-300 mb-10"
        >
          <AlertTitle className="flex flex-row">
            <CircleAlert className="mr-2" />
            <p className="font-bold pt-0.5 pl-2">
              Hmm... That URL doesn't look right.
            </p>
          </AlertTitle>
        </Alert>
      )}
      {/* Hero Section */}
      <section className="w-full text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">{/* Larger for hero */}
          What are you whipping up in your kitchen today?
        </h1>
        <h3 className="text-lg text-gray-500">
          Clean, ad-free recipes from any cooking website
        </h3>
      </section>
      {/* Search Section */}
      <section className="w-full flex flex-col items-center mb-16">
        <div className="w-full max-w-2xl">
          <SearchForm setErrorAction={setError} />
        </div>
      </section>
      {/* Recent Recipes Section */}
      <section className="w-full">
        <RecentRecipesList />
      </section>
      <footer className="flex items-center justify-center mt-16">
      </footer>
    </div>
  );
}
