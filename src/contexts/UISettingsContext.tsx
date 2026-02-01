'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

export type StepSizing = 'sm' | 'med' | 'lg';
export type FontFamily = 'sans' | 'serif';

type UISettingsState = {
  stepSizing: StepSizing;
  fontFamily: FontFamily;
};

type UISettingsContextType = {
  settings: UISettingsState;
  isReady: boolean;
  setStepSizing: (sizing: StepSizing) => void;
  setFontFamily: (family: FontFamily) => void;
};

const STORAGE_KEY = 'uiSettings';

const defaultSettings: UISettingsState = {
  stepSizing: 'med',
  fontFamily: 'sans',
};

const UISettingsContext = createContext<UISettingsContextType | undefined>(
  undefined,
);

export function UISettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UISettingsState>(defaultSettings);
  const [isReady, setIsReady] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UISettingsState>;
        setSettings({
          stepSizing:
            parsed.stepSizing ?? defaultSettings.stepSizing,
          fontFamily:
            parsed.fontFamily ?? defaultSettings.fontFamily,
        });
      }
    } catch (error) {
      console.error('Error reading UI settings from localStorage:', error);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Persist settings whenever they change (after first load)
  useEffect(() => {
    if (!isReady) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving UI settings to localStorage:', error);
    }
  }, [isReady, settings]);

  const setStepSizing = (sizing: StepSizing) => {
    setSettings((prev) => ({ ...prev, stepSizing: sizing }));
  };

  const setFontFamily = (family: FontFamily) => {
    setSettings((prev) => ({ ...prev, fontFamily: family }));
  };

  const value = useMemo(
    () => ({
      settings,
      isReady,
      setStepSizing,
      setFontFamily,
    }),
    [settings, isReady],
  );

  return (
    <UISettingsContext.Provider value={value}>
      {children}
    </UISettingsContext.Provider>
  );
}

export function useUISettings() {
  const context = useContext(UISettingsContext);
  if (!context) {
    throw new Error('useUISettings must be used within a UISettingsProvider');
  }
  return context;
}

