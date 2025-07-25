'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function RecipeSkeleton() {
  return (
    <div className="bg-[#fbf7f2] min-h-screen" aria-busy="true">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex-1 mr-4">
            <Skeleton
              height={32}
              width="70%"
              baseColor="#f0f0f0"
              highlightColor="#f8f8f8"
              borderRadius={4}
            />
          </div>
          <Skeleton
            height={40}
            width={140}
            baseColor="#f0f0f0"
            highlightColor="#f8f8f8"
            borderRadius={8}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Ingredients Section Skeleton */}
          <div className="bg-white rounded-lg border border-[#d9d9d9] p-6">
            <Skeleton
              height={24}
              width="40%"
              baseColor="#f0f0f0"
              highlightColor="#f8f8f8"
              borderRadius={4}
              className="mb-6"
            />

            {/* Ingredient Group 1 */}
            <div className="mb-6">
              <Skeleton
                height={18}
                width="30%"
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
                className="mb-3"
              />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton
                      width={8}
                      height={8}
                      baseColor="#f0f0f0"
                      highlightColor="#f8f8f8"
                      borderRadius="50%"
                      className="mt-1 flex-shrink-0"
                    />
                    <Skeleton
                      height={16}
                      width={`${Math.random() * 40 + 60}%`}
                      baseColor="#f0f0f0"
                      highlightColor="#f8f8f8"
                      borderRadius={4}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Ingredient Group 2 */}
            <div className="mb-6">
              <Skeleton
                height={18}
                width="25%"
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
                className="mb-3"
              />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Skeleton
                      width={8}
                      height={8}
                      baseColor="#f0f0f0"
                      highlightColor="#f8f8f8"
                      borderRadius="50%"
                      className="mt-1 flex-shrink-0"
                    />
                    <Skeleton
                      height={16}
                      width={`${Math.random() * 40 + 60}%`}
                      baseColor="#f0f0f0"
                      highlightColor="#f8f8f8"
                      borderRadius={4}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Instructions Section Skeleton */}
          <div className="bg-white rounded-lg border border-[#d9d9d9] p-6">
            <Skeleton
              height={24}
              width="35%"
              baseColor="#f0f0f0"
              highlightColor="#f8f8f8"
              borderRadius={4}
              className="mb-6"
            />

            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton
                    width={24}
                    height={24}
                    baseColor="#f0f0f0"
                    highlightColor="#f8f8f8"
                    borderRadius="50%"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <Skeleton
                      height={16}
                      width="100%"
                      baseColor="#f0f0f0"
                      highlightColor="#f8f8f8"
                      borderRadius={4}
                    />
                    <Skeleton
                      height={16}
                      width={`${Math.random() * 30 + 70}%`}
                      baseColor="#f0f0f0"
                      highlightColor="#f8f8f8"
                      borderRadius={4}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
