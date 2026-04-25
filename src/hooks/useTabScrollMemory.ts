import { useLayoutEffect, useRef } from "react";

export function useTabScrollMemory(activeTab: string) {
  const positions = useRef<Record<string, number>>({});
  const prevTab = useRef(activeTab);

  useLayoutEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const prev = prevTab.current;
    if (prev === activeTab) return;
    positions.current[prev] = main.scrollTop;
    main.scrollTop = positions.current[activeTab] ?? 0;
    prevTab.current = activeTab;
  }, [activeTab]);
}
