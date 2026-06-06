import type { Metadata } from "next";
import { BrandGuidelinesDocPage, getBrandGuidelinesDoc } from "../brand-docs";

export const metadata: Metadata = {
  title: "Brand Guidelines | Mizen",
  description: "Mizen brand identity, color, typography, voice, and asset guidelines.",
};

export default function BrandGuidelinesPage() {
  return <BrandGuidelinesDocPage doc={getBrandGuidelinesDoc("overview")} />;
}
