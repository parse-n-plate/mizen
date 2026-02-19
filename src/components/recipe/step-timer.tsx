'use client';

import React, { useEffect, useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Button } from '@/components/ui/button';
import { Timer, Pause, Play, RotateCcw, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepTimerProps {
  durationMinutes: number;
  label?: string;
  stepNumber: number;
  variant?: 'compact' | 'spacious' | 'minimal';
}

export function StepTimer({ 
  durationMinutes, 
  label, 
  stepNumber, 
  variant = 'compact' 
}: StepTimerProps) {
  const { startTimer, pauseTimer, resetTimer, getTimerForStep } = useTimer();
  const activeTimer = getTimerForStep(stepNumber);
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [isComplete, setIsComplete] = useState(false);

  // Reset state when timer becomes inactive
  useEffect(() => {
    if (!activeTimer) {
      setTimeLeft(durationMinutes * 60);
      setIsComplete(false);
    }
  }, [activeTimer, durationMinutes]);

  // Update time left via interval when timer is active
  useEffect(() => {
    if (!activeTimer) {
      return;
    }

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - activeTimer.startTime) / 1000);
      const remaining = (activeTimer.durationMinutes * 60) - elapsedSeconds;
      
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsComplete(true);
        clearInterval(interval);
        
        // Play notification if supported
        if (Notification.permission === 'granted') {
          new Notification('Timer Complete!', {
            body: `${label || 'Step ' + stepNumber} timer is done!`,
          });
        }
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTimer, durationMinutes, label, stepNumber]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    startTimer(stepNumber, durationMinutes, label || `Step ${stepNumber}`);
  };

  const handlePause = () => {
    pauseTimer(stepNumber);
  };

  const handleReset = () => {
    resetTimer(stepNumber);
    setIsComplete(false);
    setTimeLeft(durationMinutes * 60);
  };

  if (variant === 'compact') {
    if (isComplete) {
      return (
        <Button 
          size="sm" 
          variant="outline" 
          className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 h-7 px-2 text-xs"
          onClick={handleReset}
        >
          <CheckCircle className="h-3 w-3 mr-1" />
          Done
        </Button>
      );
    }

    if (activeTimer) {
      return (
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm font-medium w-[3.5ch] text-stone-700">
            {formatTime(timeLeft)}
          </span>
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 rounded-full"
            onClick={handlePause}
          >
            <Pause className="h-3 w-3" />
          </Button>
        </div>
      );
    }

    return (
      <Button 
        size="sm" 
        variant="outline" 
        className="h-7 px-2 text-xs border-dashed border-stone-300 text-stone-500 hover:text-stone-700"
        onClick={handleStart}
      >
        <Timer className="h-3 w-3 mr-1" />
        {durationMinutes}m
      </Button>
    );
  }

  // Spacious & Minimal Layouts
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-colors",
      isComplete ? "bg-green-50 border border-green-100" : 
      activeTimer ? "bg-purple-50 border border-purple-100" : 
      "bg-stone-50 border border-stone-100"
    )}>
      <div className={cn(
        "flex-1 flex flex-col",
        variant === 'minimal' ? "items-center text-center" : ""
      )}>
        <span className="text-xs uppercase tracking-wider font-semibold text-stone-500 mb-0.5">
          {label || 'Timer'}
        </span>
        <span className={cn(
          "font-mono font-bold text-stone-800",
          variant === 'minimal' ? "text-3xl" : "text-xl",
          isComplete && "text-green-600"
        )}>
          {isComplete ? "Done!" : formatTime(timeLeft)}
        </span>
      </div>
      
      <div className="flex items-center gap-1">
        {isComplete ? (
          <Button onClick={handleReset} variant="outline" size="sm" className="border-green-200 text-green-700 hover:bg-green-100">
            Dismiss
          </Button>
        ) : activeTimer ? (
          <>
            <Button onClick={handlePause} size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white shadow-sm">
              <Pause className="h-4 w-4" />
            </Button>
            <Button onClick={handleReset} size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-red-50 hover:text-red-500">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button onClick={handleStart} className="bg-stone-800 text-white hover:bg-stone-700">
            <Play className="h-4 w-4 mr-2" />
            Start {durationMinutes}m
          </Button>
        )}
      </div>
    </div>
  );
}
