'use client';

import { Clock } from 'lucide-react';

interface TimerCardProps {
  time: number;
}

export default function TimerCard({ time }: TimerCardProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-albert font-medium text-[#1e1e1e]">Timer</h3>
        <Clock className="w-4 h-4 text-stone-400" />
      </div>
      <div className="flex items-baseline gap-1.5 mb-3">
        <span className="font-domine text-[32px] text-[#193d34] leading-none">{time}</span>
        <span className="font-albert text-stone-500">minutes</span>
      </div>
      <button className="w-full bg-[#193d34] text-white font-albert font-medium py-2.5 rounded-lg hover:bg-[#142f28] transition-colors">
        Start Timer
      </button>
    </div>
  );
}





