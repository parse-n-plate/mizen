import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BrandGuidelinesDocPage,
  getBrandGuidelinesDoc,
  getBrandGuidelinesTitle,
} from "../../brand-docs";
import {
  BRAND_GUIDELINES_SLUGS,
  type BrandGuidelinesSlug,
  isBrandGuidelinesSlug,
} from "../../brand-nav";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return BRAND_GUIDELINES_SLUGS.filter((slug) => slug !== "overview").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isBrandGuidelinesSlug(slug)) {
    return {};
  }

  return {
    title: `${getBrandGuidelinesTitle(slug)} | Mizen Brand Guidelines`,
    description: getBrandGuidelinesDoc(slug).description,
  };
}

export default async function BrandGuidelinesSlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (!isBrandGuidelinesSlug(slug)) {
    notFound();
  }

  return <BrandGuidelinesDocPage doc={getBrandGuidelinesDoc(slug as BrandGuidelinesSlug)} />;
}
