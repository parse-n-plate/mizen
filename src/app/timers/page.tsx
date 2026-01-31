'use client';

import { Clock } from 'lucide-react';
import MobileBackButton from '@/components/ui/MobileBackButton';

export default function TimersPage() {
  return (
    <div className="min-h-screen bg-white">
      <MobileBackButton />
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-12 md:pt-16">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-8 h-8 text-stone-400" />
          <h1 className="font-domine text-[28px] md:text-[32px] font-normal text-black">
            Timers
          </h1>
        </div>
        <p className="font-albert text-stone-500">
          Cooking timers coming soon.
        </p>
      </div>
    </div>
  );
}
