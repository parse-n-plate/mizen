'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ActiveTimer {
  stepNumber: number;
  startTime: number;          // Unix timestamp when started
  durationMinutes: number;
  label: string;
  originalDurationSeconds?: number; // Store original duration in seconds for accuracy
}

interface TimerContextType {
  activeTimers: ActiveTimer[];
  startTimer: (stepNumber: number, durationMinutes: number, label: string) => void;
  pauseTimer: (stepNumber: number) => void;
  resetTimer: (stepNumber: number) => void;
  getTimerForStep: (stepNumber: number) => ActiveTimer | undefined;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export function TimerProvider({ children }: { children: ReactNode }) {
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('activeTimers');
    if (saved) {
      try {
        return JSON.parse(saved) as ActiveTimer[];
      } catch (error) {
        console.error('Error loading timers:', error);
      }
    }
    return [];
  });
  const [isLoaded] = useState(true);

  // Save timers to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('activeTimers', JSON.stringify(activeTimers));
    }
  }, [activeTimers, isLoaded]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startTimer = (stepNumber: number, durationMinutes: number, label: string) => {
    setActiveTimers(prev => {
      // Remove existing timer for this step if any
      const filtered = prev.filter(t => t.stepNumber !== stepNumber);
      return [...filtered, {
        stepNumber,
        startTime: Date.now(),
        durationMinutes,
        label,
        originalDurationSeconds: durationMinutes * 60
      }];
    });
  };

  const pauseTimer = (stepNumber: number) => {
    setActiveTimers(prev => prev.filter(t => t.stepNumber !== stepNumber));
  };

  const resetTimer = (stepNumber: number) => {
    setActiveTimers(prev => prev.filter(t => t.stepNumber !== stepNumber));
  };

  const getTimerForStep = (stepNumber: number) => {
    return activeTimers.find(t => t.stepNumber === stepNumber);
  };

  return (
    <TimerContext.Provider value={{ activeTimers, startTimer, pauseTimer, resetTimer, getTimerForStep }}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}

