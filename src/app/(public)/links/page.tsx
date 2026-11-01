import type { Metadata } from "next";
import { LinksPageContent } from "@/components/LinksPageContent";

export const metadata: Metadata = {
  title: "Links | Mizen",
  description: "Mizen links, updates, and favorite recipes.",
};

export default function LinksPage() {
  return <LinksPageContent />;
}
