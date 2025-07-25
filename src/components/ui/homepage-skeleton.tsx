'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function HomepageSkeleton() {
  return (
    <div className="bg-[#fbf7f2] min-h-screen" aria-busy="true">
      {/* Main Content Container */}
      <div className="max-w-md mx-auto px-4 pt-28 pb-16">
        {/* Hero Section Skeleton */}
        <div className="mb-16">
          {/* Title Skeleton */}
          <Skeleton
            height={36}
            width="80%"
            baseColor="#f0f0f0"
            highlightColor="#f8f8f8"
            borderRadius={4}
            className="mb-5"
          />

          {/* Search Form Skeleton */}
          <div className="relative">
            <div className="bg-white rounded-full border border-[#d9d9d9] flex items-center px-4 py-3">
              <Skeleton
                width={16}
                height={16}
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
                className="mr-2 flex-shrink-0"
              />
              <Skeleton
                height={16}
                width="70%"
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
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
            baseColor="#f0f0f0"
            highlightColor="#f8f8f8"
            borderRadius={4}
          />

          {/* Recipe Cards Skeleton */}
          <div className="space-y-2">
            {/* Recipe Card 1 */}
            <div className="bg-white rounded-lg border border-[#d9d9d9] p-6">
              <div className="space-y-2">
                <Skeleton
                  height={16}
                  width="75%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="90%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="60%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
              </div>
            </div>

            {/* Recipe Card 2 */}
            <div className="bg-white rounded-lg border border-[#d9d9d9] p-6">
              <div className="space-y-2">
                <Skeleton
                  height={16}
                  width="70%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="85%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="55%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
              </div>
            </div>

            {/* Recipe Card 3 */}
            <div className="bg-white rounded-lg border border-[#d9d9d9] p-6">
              <div className="space-y-2">
                <Skeleton
                  height={16}
                  width="80%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="90%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
                  borderRadius={4}
                />
                <Skeleton
                  height={16}
                  width="65%"
                  baseColor="#f0f0f0"
                  highlightColor="#f8f8f8"
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
