"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      closeButton
      toastOptions={{
        className: "font-sans text-sm",
        duration: 3000,
      }}
    />
  );
}
