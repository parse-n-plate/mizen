'use client';

import React, { Suspense, use } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChefHat, ArrowLeft } from 'lucide-react';
import { DesignLabTabs } from '@/components/ui/design-lab-tabs';
import { Button } from '@/components/ui/button';
import { MOCK_PARSED_RECIPE } from '@/lib/mockRecipeData';
import { CompactVariation } from '@/components/variations/compact-variation';
import { SpaciousVariation } from '@/components/variations/spacious-variation';
import { MinimalVariation } from '@/components/variations/minimal-variation';
import { TestingControlsPanel } from '@/components/ui/testing-controls-panel';

function RecipeDirectionsContent() {
  const searchParams = useSearchParams();
  const currentVariant = searchParams.get('variant') || 'compact';

  return (
    <div className="min-h-screen bg-white font-albert text-[#37352F]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-[#E0E0E0] px-4 py-3 md:px-8 transition-all">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-white rounded shadow-sm flex items-center justify-center border border-[#E0E0E0]">
                <ChefHat className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h1 className="font-domine font-bold text-sm md:text-base text-[#37352F]">
                  Recipe Directions Lab
                </h1>
              </div>
            </div>
          </div>
          
          {/* Variant Switcher */}
          <div className="w-full max-w-[300px] hidden md:block">
            <DesignLabTabs />
          </div>
        </div>
        
        {/* Mobile Variant Switcher */}
        <div className="mt-3 md:hidden">
          <DesignLabTabs />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-2xl mx-auto pt-6 pb-24 px-4">
        <div className="mb-6">
          <h2 className="font-domine text-2xl font-bold text-stone-900">{MOCK_PARSED_RECIPE.title}</h2>
          <p className="text-stone-500 font-albert text-sm mt-1">{MOCK_PARSED_RECIPE.description}</p>
        </div>

        {currentVariant === 'compact' && (
          <CompactVariation recipe={MOCK_PARSED_RECIPE} />
        )}
        
        {currentVariant === 'spacious' && (
          <SpaciousVariation recipe={MOCK_PARSED_RECIPE} />
        )}
        
        {currentVariant === 'minimal' && (
          <MinimalVariation recipe={MOCK_PARSED_RECIPE} />
        )}
      </div>

      {/* Testing Controls */}
      <TestingControlsPanel />
    </div>
  );
}

export default function RecipeDirectionsPage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {} as any) {
  // For Next.js 15: Unwrap params/searchParams if provided to prevent enumeration warnings
  // This prevents React DevTools/error serialization from enumerating these props
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (params) use(params);
  // eslint-disable-next-line react-hooks/rules-of-hooks  
  if (searchParams) use(searchParams);
  
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RecipeDirectionsContent />
    </Suspense>
  );
}
