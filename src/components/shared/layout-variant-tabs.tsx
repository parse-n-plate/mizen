'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { List, Layout, Monitor } from 'lucide-react';

interface DesignLabTabsProps {
  defaultValue?: string;
}

export function DesignLabTabs({ defaultValue = 'compact' }: DesignLabTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentVariant = searchParams.get('variant') || defaultValue;

  const handleValueChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('variant', value);
    router.push(`?${params.toString()}`);
  };

  return (
    <Tabs value={currentVariant} onValueChange={handleValueChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 bg-stone-100">
        <TabsTrigger value="compact" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <List className="h-4 w-4" />
          <span>Compact</span>
        </TabsTrigger>
        <TabsTrigger value="spacious" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <Layout className="h-4 w-4" />
          <span>Spacious</span>
        </TabsTrigger>
        <TabsTrigger value="minimal" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
          <Monitor className="h-4 w-4" />
          <span>Minimal</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

