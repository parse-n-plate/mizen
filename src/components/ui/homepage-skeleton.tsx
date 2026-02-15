'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function HomepageSkeleton() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === 'dark';
  const baseColor = isDark ? '#292524' : '#f0f0f0';
  const highlightColor = isDark ? '#44403C' : '#f8f8f8';

  return (
    <div className="bg-white dark:bg-stone-900 min-h-screen" aria-busy="true">
      {/* Main Content Container */}
      <div className="max-w-md mx-auto px-4 pt-28 pb-16">
        {/* Hero Section Skeleton */}
        <div className="mb-16">
          {/* Title Skeleton */}
          <Skeleton
            height={36}
            width="80%"
            baseColor={baseColor}
            highlightColor={highlightColor}
            borderRadius={4}
            className="mb-5"
          />

          {/* Search Form Skeleton */}
          <div className="relative">
            <div className="bg-white dark:bg-stone-800 rounded-full border border-[#d9d9d9] dark:border-stone-700 flex items-center px-4 py-3">
              <Skeleton
                width={16}
                height={16}
                baseColor={baseColor}
                highlightColor={highlightColor}
                borderRadius={4}
                className="mr-2 flex-shrink-0"
              />
              <Skeleton
                height={16}
                width="70%"
                baseColor={baseColor}
                highlightColor={highlightColor}
                borderRadius={4}
              />
            </div>
          </div>
        </div>

        {/* Recent Recipes Section Skeleton */}
        <div className="space-y-4">
          {/* Section Title Skeleton */}
          <Skeleton
            height={20}
            width="60%"
            baseColor={baseColor}
            highlightColor={highlightColor}
            borderRadius={4}
          />

          {/* Recipe Cards Skeleton */}
          <div className="space-y-2">
            {/* Recipe Card 1 */}
            <div className="bg-white dark:bg-stone-800 rounded-lg border border-[#d9d9d9] dark:border-stone-700 p-6">
              <div className="space-y-2">
                <Skeleton
                  height={16}
                  width="75%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="90%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="60%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
              </div>
            </div>

            {/* Recipe Card 2 */}
            <div className="bg-white dark:bg-stone-800 rounded-lg border border-[#d9d9d9] dark:border-stone-700 p-6">
              <div className="space-y-2">
                <Skeleton
                  height={16}
                  width="70%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="85%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="55%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
              </div>
            </div>

            {/* Recipe Card 3 */}
            <div className="bg-white dark:bg-stone-800 rounded-lg border border-[#d9d9d9] dark:border-stone-700 p-6">
              <div className="space-y-2">
                <Skeleton
                  height={16}
                  width="80%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="90%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="65%"
                  baseColor={baseColor}
                  highlightColor={highlightColor}
                  borderRadius={4}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}












