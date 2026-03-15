export type Theme = "light" | "dark" | "system";

export function getTheme(): Theme {
  if (typeof window === "undefined") return "system";
  return (localStorage.getItem("theme") as Theme) || "system";
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === "system") {
    localStorage.removeItem("theme");
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    root.classList.toggle("dark", isDark);
  } else {
    localStorage.setItem("theme", theme);
    root.classList.toggle("dark", theme === "dark");
  }
}

export function initThemeListener() {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (e: MediaQueryListEvent) => {
    if (!localStorage.getItem("theme")) {
      document.documentElement.classList.toggle("dark", e.matches);
    }
  };

  mq.addEventListener("change", handler);
  return () => mq.removeEventListener("change", handler);
}
