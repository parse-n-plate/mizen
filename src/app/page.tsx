'use client';

import HomepageSkeleton from '@/components/ui/homepage-skeleton';
import HomepageSearch from '@/components/ui/homepage-search';
import HomepageRecentRecipes from '@/components/ui/homepage-recent-recipes';
import HomepageBanner from '@/components/ui/homepage-banner';
import MobileBackButton from '@/components/ui/MobileBackButton';
import { useState, useEffect, Suspense, use } from 'react';
import { motion } from 'framer-motion';

function HomeContent() {
  const [isPageLoaded, setIsPageLoaded] = useState<boolean>(false);

  // Trigger onload animation when component mounts
  useEffect(() => {
    // Small delay to ensure smooth animation start
    const timer = setTimeout(() => {
      setIsPageLoaded(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-white relative">
      <MobileBackButton />
      {/* Homepage Banner - Only on landing page */}
      <HomepageBanner />

      <div className="transition-opacity duration-300 opacity-100 relative z-10" style={{ transitionTimingFunction: 'var(--ease-in-out-cubic)' }}>
        {/* Main Content Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-16 md:pb-20">
          {/* Hero Section */}
          <div className={`text-center space-y-5 md:space-y-6 ${isPageLoaded ? 'page-fade-in-up' : 'opacity-0'}`}>
              <h1 className="font-domine text-[57.6px] sm:text-[67.2px] md:text-[76.8px] font-bold text-black leading-[1.05] flex flex-col items-center justify-center gap-2 md:gap-3">
                <span className="flex items-center gap-2 md:gap-3">
                  Clean recipes,
                  <motion.img
                    src="/assets/Illustration Icons/Tomato_Icon.png"
                    alt=""
                    className="hidden md:block w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0 object-contain"
                    aria-hidden="true"
                    draggable={false}
                    whileHover={{ scale: 1.15, rotate: 8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  />
                </span>
                <span className="flex items-center gap-2 md:gap-3">
                  <motion.img
                    src="/assets/Illustration Icons/Pan_Icon.png"
                    alt=""
                    className="hidden md:block w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 flex-shrink-0 object-contain"
                    aria-hidden="true"
                    draggable={false}
                    whileHover={{ scale: 1.15, rotate: -8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  />
                  calm cooking.
                </span>
              </h1>
              <p className="font-albert text-[16px] sm:text-[18px] md:text-[20px] text-stone-600 leading-[1.6] max-w-2xl mx-auto">
                No distractions. No clutter. Just clear, elegant recipes<span className="responsive-break"></span> designed for people who love to cook.
              </p>
              
              {/* Homepage Search Bar */}
              <div className={`${isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0'}`}>
                <HomepageSearch />
              </div>
              
              {/* Recent Recipes - Under Search Bar */}
              <div className={`${isPageLoaded ? 'page-fade-in-up page-fade-delay-1' : 'opacity-0'}`}>
                <HomepageRecentRecipes />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home({
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
    <Suspense fallback={<HomepageSkeleton />}>
      <HomeContent />
    </Suspense>
  );
}
