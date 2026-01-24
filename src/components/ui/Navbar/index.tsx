'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import InlineSearch from '@/components/ui/Navbar/inline-search';
import Link from 'next/link';

export default function Navbar() {
  return (
    <div className="bg-white px-4 md:px-6 py-3 md:py-4 sticky top-0 z-[10000] border-b border-stone-200">
      <div className="max-w-6xl mx-auto flex items-center gap-4 md:gap-6">
        {/* Left: Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link 
            href="/" 
            className="group transition-all duration-300 ease-in-out"
          >
            <PPLogo />
          </Link>
        </div>

        {/* Center: Inline Search */}
        <div className="flex-1 max-w-md mx-auto">
          <InlineSearch />
        </div>
      </div>
    </div>
  );
}
