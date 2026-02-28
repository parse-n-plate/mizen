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
  /** Controls whether ingredient step tags (pills) are shown in StepDisplay */
  showIngredientStepTags: boolean;
  /** Controls whether "Ingredients for this step" list is shown in ContextPanel */
  showIngredientsForStepList: boolean;
  /** Controls whether error state testing tools are shown */
  enableErrorStateTesting: boolean;
};

type AdminSettingsContextType = {
  settings: AdminSettingsState;
  isReady: boolean;
  setShowRecentRecipeImages: (value: boolean) => void;
  toggleShowRecentRecipeImages: () => void;
  setShowIngredientStepTags: (value: boolean) => void;
  toggleShowIngredientStepTags: () => void;
  setShowIngredientsForStepList: (value: boolean) => void;
  toggleShowIngredientsForStepList: () => void;
  setEnableErrorStateTesting: (value: boolean) => void;
  toggleEnableErrorStateTesting: () => void;
};

const STORAGE_KEY = 'adminSettings';

const defaultSettings: AdminSettingsState = {
  showRecentRecipeImages: true,
  showIngredientStepTags: true,
  showIngredientsForStepList: true,
  enableErrorStateTesting: false,
};

const AdminSettingsContext = createContext<
  AdminSettingsContextType | undefined
>(undefined);

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
            parsed.showRecentRecipeImages ??
            defaultSettings.showRecentRecipeImages,
          showIngredientStepTags:
            parsed.showIngredientStepTags ??
            defaultSettings.showIngredientStepTags,
          showIngredientsForStepList:
            parsed.showIngredientsForStepList ??
            defaultSettings.showIngredientsForStepList,
          enableErrorStateTesting:
            parsed.enableErrorStateTesting ??
            defaultSettings.enableErrorStateTesting,
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

  const setShowIngredientStepTags = (value: boolean) => {
    setSettings((prev) => ({ ...prev, showIngredientStepTags: value }));
  };

  const toggleShowIngredientStepTags = () => {
    setSettings((prev) => ({
      ...prev,
      showIngredientStepTags: !prev.showIngredientStepTags,
    }));
  };

  const setShowIngredientsForStepList = (value: boolean) => {
    setSettings((prev) => ({ ...prev, showIngredientsForStepList: value }));
  };

  const toggleShowIngredientsForStepList = () => {
    setSettings((prev) => ({
      ...prev,
      showIngredientsForStepList: !prev.showIngredientsForStepList,
    }));
  };

  const setEnableErrorStateTesting = (value: boolean) => {
    setSettings((prev) => ({ ...prev, enableErrorStateTesting: value }));
  };

  const toggleEnableErrorStateTesting = () => {
    setSettings((prev) => ({
      ...prev,
      enableErrorStateTesting: !prev.enableErrorStateTesting,
    }));
  };

  const value = useMemo(
    () => ({
      settings,
      isReady,
      setShowRecentRecipeImages,
      toggleShowRecentRecipeImages,
      setShowIngredientStepTags,
      toggleShowIngredientStepTags,
      setShowIngredientsForStepList,
      toggleShowIngredientsForStepList,
      setEnableErrorStateTesting,
      toggleEnableErrorStateTesting,
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
    throw new Error(
      'useAdminSettings must be used within an AdminSettingsProvider',
    );
  }
  return context;
}
