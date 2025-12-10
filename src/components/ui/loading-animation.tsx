'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LoadingAnimationProps {
  isVisible: boolean;
}

export default function LoadingAnimation({ isVisible }: LoadingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Array of cooking-themed loading messages that cycle through
  const loadingSteps = [
    '🔍 Finding your recipe...',
    '🥘 Reading the ingredients...',
    '📝 Breaking down the steps...',
    '🧠 Understanding the cooking process...',
    '✨ Almost ready to serve...',
    '🍳 Final touches...',
  ];

  // Cycle through loading messages every 2 seconds
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % loadingSteps.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible, loadingSteps.length]);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-0 bg-neutral-50/95 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{ marginTop: '72px' }}
    >
      <div className="text-center space-y-6 max-w-sm mx-auto px-4">
        {/* Fish mark with gentle bounce */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-8 rounded-full bg-neutral-200/60 blur-xl" aria-hidden />
          <div className="relative bg-white/90 border border-neutral-200 rounded-full p-6 shadow-sm backdrop-blur">
            <Image
              src="/assets/icons/Fish Logo.svg"
              alt="Parse & Plate fish logo"
              width={96}
              height={96}
              className="fish-bounce"
              priority
            />
          </div>
        </div>

        {/* Loading message */}
        <div className="space-y-2">
          <p className="font-albert text-[18px] text-[#1e1e1e] font-medium">
            {loadingSteps[currentStep]}
          </p>
          <p className="font-albert text-[14px] text-[#666]">
            This usually takes 10-30 seconds
          </p>
        </div>

        {/* Animated dots */}
        <div className="flex justify-center space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-neutral-800 loader-dot"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1.1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
