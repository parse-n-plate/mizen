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
