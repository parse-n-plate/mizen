import { useRef, useCallback } from "react";

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useHorizontalSwipe(
  onSwipeLeft: () => void,
  onSwipeRight: () => void,
  threshold = 48
): SwipeHandlers {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null || startY.current === null) return;
      const dx = e.changedTouches[0].clientX - startX.current;
      const dy = e.changedTouches[0].clientY - startY.current;
      // Only fire when horizontal movement is dominant and exceeds threshold
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > threshold) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
      startX.current = null;
      startY.current = null;
    },
    [onSwipeLeft, onSwipeRight, threshold]
  );

  return { onTouchStart, onTouchEnd };
}
