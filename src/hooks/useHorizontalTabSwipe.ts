import { useCallback, useRef, type TouchEvent } from "react";

type RecipeTab = "prep" | "cook";

const SWIPE_DISTANCE = 56;

export function useHorizontalTabSwipe(activeTab: RecipeTab, onTabChange: (tab: RecipeTab) => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((event: TouchEvent<HTMLElement>) => {
    if (event.touches.length !== 1) {
      touchStart.current = null;
      return;
    }

    const touch = event.touches[0];
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || event.changedTouches.length !== 1) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      if (Math.abs(deltaX) < SWIPE_DISTANCE || Math.abs(deltaX) <= Math.abs(deltaY)) return;

      if (deltaX < 0 && activeTab === "prep") onTabChange("cook");
      if (deltaX > 0 && activeTab === "cook") onTabChange("prep");
    },
    [activeTab, onTabChange]
  );

  return { onTouchStart, onTouchEnd };
}
