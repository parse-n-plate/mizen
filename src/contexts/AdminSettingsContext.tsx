'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

type AdminSettingsState = {
  /** Controls whether recent recipe cards should try to render images */
  showRecentRecipeImages: boolean;
};

type AdminSettingsContextType = {
  settings: AdminSettingsState;
  isReady: boolean;
  setShowRecentRecipeImages: (value: boolean) => void;
  toggleShowRecentRecipeImages: () => void;
};

const STORAGE_KEY = 'adminSettings';

const defaultSettings: AdminSettingsState = {
  showRecentRecipeImages: true,
};

const AdminSettingsContext = createContext<AdminSettingsContextType | undefined>(
  undefined,
);

export function AdminSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AdminSettingsState>(defaultSettings);
  const [isReady, setIsReady] = useState(false);

  // Load persisted settings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AdminSettingsState>;
        setSettings({
          showRecentRecipeImages:
            parsed.showRecentRecipeImages ?? defaultSettings.showRecentRecipeImages,
        });
      }
    } catch (error) {
      console.error('Error reading admin settings from localStorage:', error);
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
      console.error('Error saving admin settings to localStorage:', error);
    }
  }, [isReady, settings]);

  const setShowRecentRecipeImages = (value: boolean) => {
    setSettings((prev) => ({ ...prev, showRecentRecipeImages: value }));
  };

  const toggleShowRecentRecipeImages = () => {
    setSettings((prev) => ({
      ...prev,
      showRecentRecipeImages: !prev.showRecentRecipeImages,
    }));
  };

  const value = useMemo(
    () => ({
      settings,
      isReady,
      setShowRecentRecipeImages,
      toggleShowRecentRecipeImages,
    }),
    [settings, isReady],
  );

  return (
    <AdminSettingsContext.Provider value={value}>
      {children}
    </AdminSettingsContext.Provider>
  );
}

export function useAdminSettings() {
  const context = useContext(AdminSettingsContext);
  if (!context) {
    throw new Error('useAdminSettings must be used within an AdminSettingsProvider');
  }
  return context;
}














