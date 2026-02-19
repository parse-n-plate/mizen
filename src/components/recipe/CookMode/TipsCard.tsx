'use client';

import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface TipsCardProps {
  tip: string;
}

export default function TipsCard({ tip }: TipsCardProps) {
  if (!tip) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#fffbeb] border border-[#fee685] rounded-[20px] p-6 flex flex-col gap-3 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 translate-x-1 translate-y--1">
        <Lightbulb className="w-24 h-24 text-[#7b3306]" />
      </div>
      
      <div className="flex items-center gap-2.5 relative z-10">
        <div className="w-8 h-8 rounded-full bg-[#fef3c7] flex items-center justify-center">
          <Lightbulb className="w-4.5 h-4.5 text-[#7b3306]" />
        </div>
        <h3 className="font-albert font-bold text-[16px] text-[#7b3306] uppercase tracking-wider">
          Pro Tip
        </h3>
      </div>
      
      <p className="font-albert text-[17px] text-[#92400e] leading-relaxed relative z-10">
        {tip}
      </p>
    </motion.div>
  );
}







