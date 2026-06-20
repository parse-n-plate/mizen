import type { Metadata } from "next";
import { DesignSystemDocPage, getDesignSystemDoc } from "./docs";

export const metadata: Metadata = {
  title: "Design System | Mizen",
  description: "Mizen's interface foundations, components, and recipe-focused product patterns.",
};

export default function DesignSystemPage() {
  return <DesignSystemDocPage doc={getDesignSystemDoc("overview")} />;
}
