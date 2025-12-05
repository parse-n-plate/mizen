'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export default function RecipeSkeleton() {
  return (
    <div className="bg-stone-50 min-h-screen" aria-busy="true">
      {/* Hero Section Skeleton */}
      <div className="h-[360px] w-full bg-stone-200 rounded-b-[24px] mb-6"></div>

      <div className="px-6 py-6 space-y-6">
        {/* Tabs Skeleton */}
        <div className="flex gap-3 mb-6">
          <Skeleton
            height={40}
            width="100%"
            baseColor="#f0f0f0"
            highlightColor="#f8f8f8"
            borderRadius={8}
          />
          <Skeleton
            height={40}
            width="100%"
            baseColor="#f0f0f0"
            highlightColor="#f8f8f8"
            borderRadius={8}
          />
          <Skeleton
            height={40}
            width="100%"
            baseColor="#f0f0f0"
            highlightColor="#f8f8f8"
            borderRadius={8}
          />
        </div>

        {/* Content Skeleton */}
        <div className="space-y-6">
          {/* Recipe Description Card Skeleton */}
          <div className="bg-stone-100 rounded-lg p-4 space-y-4">
            <Skeleton
              height={16}
              width="100%"
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
              width="75%"
              baseColor="#f0f0f0"
              highlightColor="#f8f8f8"
              borderRadius={4}
            />

            {/* Timing Info Skeleton */}
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-1 flex flex-col gap-1">
                  <Skeleton
                    height={10}
                    width="60%"
                    baseColor="#f0f0f0"
                    highlightColor="#f8f8f8"
                    borderRadius={4}
                  />
                  <Skeleton
                    height={16}
                    width="80%"
                    baseColor="#f0f0f0"
                    highlightColor="#f8f8f8"
                    borderRadius={4}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recipe Skills Section Skeleton */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Skeleton
                height={20}
                width="40%"
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
              />
              <Skeleton
                height={14}
                width="80%"
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
              />
            </div>

            {/* Skills Items */}
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex flex-col gap-1">
                    <Skeleton
                      height={10}
                      width="50%"
                      baseColor="#f0f0f0"
                      highlightColor="#f8f8f8"
                      borderRadius={4}
                    />
                    <div className="flex items-center gap-1">
                      <Skeleton
                        width={24}
                        height={20}
                        baseColor="#f0f0f0"
                        highlightColor="#f8f8f8"
                        borderRadius={4}
                      />
                      <Skeleton
                        height={14}
                        width="60%"
                        baseColor="#f0f0f0"
                        highlightColor="#f8f8f8"
                        borderRadius={4}
                      />
                    </div>
                  </div>
                  <Skeleton
                    height={32}
                    width={80}
                    baseColor="#f0f0f0"
                    highlightColor="#f8f8f8"
                    borderRadius={16}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Ingredients Section Skeleton */}
          <div className="bg-stone-100 rounded-lg p-6">
            <Skeleton
              height={20}
              width="30%"
              baseColor="#f0f0f0"
              highlightColor="#f8f8f8"
              borderRadius={4}
              className="mb-6"
            />

            <div className="space-y-4">
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
                    width={`${60 + i * 8}%`}
                    baseColor="#f0f0f0"
                    highlightColor="#f8f8f8"
                    borderRadius={4}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Toolbar Skeleton */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-[345px] h-[88px] flex items-center justify-center">
          <div className="bg-stone-100 rounded-full w-full h-[88px] border border-[#ebebeb] border-[1.5px]">
            <div className="flex items-center justify-between px-6 py-4 h-full">
              <Skeleton
                width={24}
                height={24}
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
              />
              <Skeleton
                width={24}
                height={24}
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
              />
              <Skeleton
                width={24}
                height={24}
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
              />
              <Skeleton
                width={24}
                height={24}
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
              />
              <Skeleton
                height={16}
                width={60}
                baseColor="#f0f0f0"
                highlightColor="#f8f8f8"
                borderRadius={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}










