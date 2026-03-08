export type NumberFormat = "fractions" | "decimals";

export function getNumberFormat(): NumberFormat {
  if (typeof window === "undefined") return "fractions";
  return (localStorage.getItem("numberFormat") as NumberFormat) || "fractions";
}

export function setNumberFormat(format: NumberFormat) {
  if (format === "fractions") {
    localStorage.removeItem("numberFormat");
  } else {
    localStorage.setItem("numberFormat", format);
  }
}
