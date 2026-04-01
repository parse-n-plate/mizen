"use client";

import { useEffect, useState } from "react";
import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 600px)");
    const syncMobile = () => setIsMobile(mediaQuery.matches);

    syncMobile();
    mediaQuery.addEventListener("change", syncMobile);
    return () => mediaQuery.removeEventListener("change", syncMobile);
  }, []);

  return (
    <SonnerToaster
      position={isMobile ? "top-center" : "bottom-center"}
      closeButton
      mobileOffset={{
        top: "calc(env(safe-area-inset-top) + 4.25rem)",
        left: "1rem",
        right: "1rem",
        bottom: "1rem",
      }}
      toastOptions={{
        className: "font-sans text-sm",
        duration: 3000,
      }}
    />
  );
}
