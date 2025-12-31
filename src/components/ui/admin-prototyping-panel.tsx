'use client';

import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, MousePointer2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminSettings } from '@/contexts/AdminSettingsContext';

export function AdminPrototypingPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { settings: adminSettings, toggleShowIngredientsForStepList } = useAdminSettings();

  return (
    <div 
      className={cn(
        "fixed right-0 top-1/2 -translate-y-1/2 bg-white border border-r-0 border-[#E0E0E0] shadow-xl transition-transform duration-300 z-[100] rounded-l-xl flex",
        isOpen ? "translate-x-0" : "translate-x-[calc(100%-24px)]"
      )}
    >
      {/* Toggle Handle */}
      <div 
        className="w-6 flex items-center justify-center bg-stone-900 text-white rounded-l-xl cursor-pointer hover:bg-stone-800 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </div>

      <div className="w-64 p-4 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <MousePointer2 className="h-4 w-4 text-[#FFBA25]" />
          <h2 className="font-domine font-bold text-stone-900">Prototype Lab</h2>
        </div>

        {/* Toggle Controls Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-albert font-bold uppercase tracking-widest text-stone-400">Display Options</h3>
          
          {/* Toggle for Ingredients List */}
          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-stone-50 transition-colors">
            <div className="flex flex-col">
              <span className="text-xs font-albert font-medium text-stone-900">Ingredients for Step</span>
              <span className="text-[10px] font-albert text-stone-400 mt-0.5">Show ingredients list in context panel</span>
            </div>
            <button
              onClick={toggleShowIngredientsForStepList}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#0C0A09]/20 focus:ring-offset-2",
                adminSettings.showIngredientsForStepList ? "bg-stone-900" : "bg-stone-200"
              )}
              aria-label="Toggle ingredients for step list"
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  adminSettings.showIngredientsForStepList ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

