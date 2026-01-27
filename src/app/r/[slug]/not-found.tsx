'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Share2 } from 'lucide-react';

export default function SharedRecipeNotFound() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-stone-100 flex items-center justify-center">
          <Share2 className="w-8 h-8 text-stone-400" />
        </div>

        <h1 className="font-domine text-2xl text-stone-900 font-bold mb-3">
          Recipe not found
        </h1>

        <p className="font-albert text-stone-600 mb-2">
          We couldn&apos;t find the recipe you&apos;re looking for.
        </p>

        <p className="font-albert text-stone-500 text-sm mb-8">
          The link may be incomplete or the recipe may no longer be available.
          Make sure you have the complete URL with the recipe data.
        </p>

        <Link
          href="/"
          className="block w-full py-3 px-4 bg-stone-900 text-white font-albert font-medium rounded-lg hover:bg-stone-800 transition-colors text-center"
        >
          Go to Home
        </Link>
      </motion.div>
    </div>
  );
}
