import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DesignSystemDocPage, getDesignSystemDoc, getDesignSystemTitle } from "../docs";
import { DESIGN_SYSTEM_SLUGS, type DesignSystemSlug, isDesignSystemSlug } from "../nav";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return DESIGN_SYSTEM_SLUGS.filter((slug) => slug !== "overview").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!isDesignSystemSlug(slug)) {
    return {};
  }

  return {
    title: `${getDesignSystemTitle(slug)} | Mizen Design System`,
    description: getDesignSystemDoc(slug).description,
  };
}

export default async function DesignSystemSlugPage({ params }: PageProps) {
  const { slug } = await params;

  if (!isDesignSystemSlug(slug)) {
    notFound();
  }

  return <DesignSystemDocPage doc={getDesignSystemDoc(slug as DesignSystemSlug)} />;
}
