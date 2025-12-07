'use client';

import { Clock } from 'lucide-react';

interface TimerCardProps {
  time: number;
}

export default function TimerCard({ time }: TimerCardProps) {
  // Don't show timer card if time is 0 or not set
  if (!time || time === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-stone-200 rounded-[16px] p-6 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-[19px] h-[19px] shrink-0">
          <Clock className="w-full h-full text-stone-950" />
        </div>
        <p className="font-albert text-[18px] text-stone-950 leading-[28px]">
          Timers
        </p>
      </div>

      {/* Timer Entries */}
      <div className="flex flex-col gap-3">
        {/* Timer Entry */}
        <div className="flex items-center justify-between">
          <p className="font-albert text-[18px] text-stone-500 leading-[28px]">
            {time} min to bake bread
          </p>
          <button className="bg-[#027df4] px-3 py-2 rounded-[10px] hover:bg-[#0269d1] transition-colors">
            <p className="font-albert font-medium text-[16px] text-white leading-6 text-center">
              Start Timer
            </p>
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-stone-200 w-full" />

        {/* Additional Timer Entry (if needed) */}
        <div className="flex items-center justify-between">
          <p className="font-albert text-[18px] text-stone-500 leading-[28px]">
            {time} min to bake bread
          </p>
          <button className="bg-[#027df4] px-3 py-2 rounded-[10px] hover:bg-[#0269d1] transition-colors">
            <p className="font-albert font-medium text-[16px] text-white leading-6 text-center">
              Start Timer
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}







