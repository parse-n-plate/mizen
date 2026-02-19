'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, RotateCcw, Copy, Smartphone, Monitor } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { cn } from '@/lib/utils';

interface TestingControlsPanelProps {
  className?: string;
}

export function TestingControlsPanel({ className }: TestingControlsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { activeTimers, resetTimer } = useTimer();
  const [copied, setCopied] = useState(false);

  const handleResetAllTimers = () => {
    activeTimers.forEach(timer => resetTimer(timer.stepNumber));
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("fixed bottom-0 left-0 right-0 bg-white border-t border-[#E0E0E0] shadow-lg transition-transform duration-300 z-50", className)}>
      {/* Toggle Handle */}
      <div 
        className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white border border-b-0 border-[#E0E0E0] rounded-t-lg px-4 py-1 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-4 w-4 text-stone-500" /> : <ChevronUp className="h-4 w-4 text-stone-500" />}
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-domine font-bold text-stone-800">Testing Controls</span>
            <span className="text-xs bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">
              {activeTimers.length} Active Timers
            </span>
          </div>
          
          {!isOpen && (
            <div className="text-xs text-stone-500 hidden md:block">
              Click to expand testing tools
            </div>
          )}
        </div>

        {/* Expanded Content */}
        {isOpen && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* Timer Controls */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Timers</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleResetAllTimers}
                disabled={activeTimers.length === 0}
              >
                <RotateCcw className="h-3 w-3 mr-2" />
                Reset All Timers
              </Button>
            </div>

            {/* View Controls */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Share & View</h3>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={handleCopyUrl}
              >
                <Copy className="h-3 w-3 mr-2" />
                {copied ? "Copied!" : "Copy Current Link"}
              </Button>
            </div>

            {/* Info */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Device Preview</h3>
              <div className="flex gap-2">
                <div className="flex-1 p-2 bg-stone-50 rounded text-center text-xs text-stone-500 flex flex-col items-center gap-1 border border-stone-100">
                  <Smartphone className="h-4 w-4" />
                  <span>Resize window width &lt; 768px</span>
                </div>
                <div className="flex-1 p-2 bg-stone-50 rounded text-center text-xs text-stone-500 flex flex-col items-center gap-1 border border-stone-100">
                  <Monitor className="h-4 w-4" />
                  <span>Desktop View &gt; 768px</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

