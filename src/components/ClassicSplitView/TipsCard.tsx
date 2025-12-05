'use client';

import { Lightbulb } from 'lucide-react';

interface TipsCardProps {
  tip: string;
}

export default function TipsCard({ tip }: TipsCardProps) {
  if (!tip) return null;

  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-600 text-sm">💡</span>
        <h3 className="font-albert font-medium text-[#7b3306]">Tip</h3>
      </div>
      <p className="font-albert text-[14px] text-[#973c00] leading-relaxed">
        {tip}
      </p>
    </div>
  );
}





