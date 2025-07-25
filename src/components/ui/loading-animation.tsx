'use client';

import { useState, useEffect } from 'react';

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
      className="fixed inset-x-0 top-0 bottom-0 bg-[#fbf7f2] bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center"
      style={{ marginTop: '72px' }}
    >
      <div className="text-center space-y-6 max-w-sm mx-auto px-4">
        {/* Animated cooking pot icon */}
        <div className="relative">
          <div className="w-24 h-24 mx-auto mb-4">
            {/* Main pot body */}
            <div className="w-20 h-16 bg-[#1e1e1e] rounded-b-full mx-auto relative">
              {/* Pot lid */}
              <div className="w-16 h-4 bg-[#1e1e1e] rounded-full mx-auto -mt-2 relative">
                {/* Lid handle */}
                <div className="w-6 h-2 bg-[#1e1e1e] rounded-full mx-auto -mt-1"></div>
              </div>

              {/* Steam animation */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1 h-3 bg-gray-400 rounded-full animate-pulse"
                      style={{
                        animationDelay: `${i * 0.2}s`,
                        animationDuration: '1.5s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Bubbling animation inside pot */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                <div className="flex space-x-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-white rounded-full animate-ping opacity-75"
                      style={{
                        animationDelay: `${i * 0.3}s`,
                        animationDuration: '2s',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
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
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[#1e1e1e] rounded-full animate-bounce"
              style={{
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
