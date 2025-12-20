'use client';

import { RecipeStep } from './types';
import TimerCard from './TimerCard';
import TipsCard from './TipsCard';
import { motion, AnimatePresence } from 'framer-motion';

interface ContextPanelProps {
  step: RecipeStep;
}

export default function ContextPanel({ step }: ContextPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-10 bg-[#fafafa]">
      <AnimatePresence mode="wait">
        <motion.div
          key={step.step} // Use step title as key to trigger re-animation
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="space-y-10"
        >
          {/* Ingredients List Section */}
          {step.ingredients && step.ingredients.length > 0 && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <span className="font-albert font-bold text-[12px] uppercase tracking-[0.2em] text-stone-400">
                  Ingredients for this step
                </span>
                <div className="h-px bg-stone-100 flex-1" />
              </div>
              
              <div className="flex flex-col gap-2">
                {step.ingredients.map((ingredient, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ x: 4 }}
                    className="group flex items-center justify-between p-3 -mx-3 rounded-xl transition-all duration-300 hover:bg-white hover:shadow-sm cursor-pointer border border-transparent hover:border-stone-100"
                  >
                    <p className="font-albert text-[17px] text-stone-500 leading-relaxed transition-colors duration-300 group-hover:text-[#193d34] group-hover:font-medium">
                      {ingredient}
                    </p>
                    <motion.div 
                      className="w-5 h-5 shrink-0 text-stone-300 group-hover:text-[#193d34] transition-colors duration-300"
                      initial={{ rotate: -45, opacity: 0 }}
                      whileHover={{ rotate: 0, opacity: 1 }}
                      animate={{ opacity: 0.4 }}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M7 17L17 7M17 7H7M17 7V17"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Timer and Tips Cards with refined spacing */}
          <div className="grid grid-cols-1 gap-6">
            <TimerCard time={step.time} />
            <TipsCard tip={step.tips} />
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
