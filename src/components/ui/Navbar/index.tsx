'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import Link from 'next/link';
import NavbarSearch from '@/components/ui/Navbar/navbar-search';

export default function Navbar() {
  return (
    <div className="bg-white border-b border-[#d9d9d9] px-4 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6">
        {/* Left: Logo and title */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <PPLogo />
          </Link>
          {/* Hide title on mobile, show on desktop */}
          <h1 className="hidden md:block font-domine text-[16px] font-bold text-[#1e1e1e] leading-none">
            Parse and Plate
          </h1>
        </div>

        {/* Center: Search - Always visible */}
        <div className="flex flex-1 max-w-lg">
          <NavbarSearch />
        </div>

        {/* Right: Auth buttons - Responsive design */}
        <nav className="flex items-center space-x-2 md:space-x-4 flex-shrink-0">
          {/* Sign In - Hidden on mobile, shown on desktop */}
          <button className="hidden md:block font-albert text-[14px] text-stone-600 hover:text-stone-800 transition-colors duration-200">
            Sign In
          </button>

          {/* Get Started - Responsive button */}
          <button className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-albert text-[12px] md:text-[14px] px-3 md:px-4 py-2 rounded-lg transition-colors duration-200">
            Get Started
          </button>
        </nav>
      </div>
    </div>
  );
}
