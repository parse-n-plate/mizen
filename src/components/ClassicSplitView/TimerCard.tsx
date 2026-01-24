'use client';

import { Clock, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface TimerCardProps {
  time: number;
}

export default function TimerCard({ time }: TimerCardProps) {
  // Don't show timer card if time is 0 or not set
  if (!time || time === 0) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white border border-stone-200 rounded-[20px] p-6 flex flex-col gap-6 shadow-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 shrink-0 bg-stone-50 rounded-full flex items-center justify-center border border-stone-100">
            <Clock className="w-4.5 h-4.5 text-[#0C0A09]" />
          </div>
          <p className="font-albert font-bold text-[18px] text-[#0C0A09] tracking-tight">
            Timers
          </p>
        </div>
      </div>

      {/* Timer Entries */}
      <div className="flex flex-col gap-4">
        {/* Timer Entry */}
        <div className="flex items-center justify-between group">
          <div className="flex flex-col gap-0.5">
            <p className="font-albert text-[16px] text-stone-500 font-medium">
              Step Timer
            </p>
            <p className="font-domine text-[20px] text-[#0C0A09] font-bold">
              {time} minutes
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05, backgroundColor: "#0269d1" }}
            whileTap={{ scale: 0.95 }}
            className="bg-[#027df4] px-5 py-2.5 rounded-[12px] shadow-sm shadow-blue-200/50 transition-colors flex items-center gap-2"
          >
            <Play className="w-4 h-4 text-white fill-current" />
            <span className="font-albert font-bold text-[15px] text-white tracking-wide">
              Start
            </span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}







