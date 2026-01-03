'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import InlineSearch from '@/components/ui/Navbar/inline-search';
import Link from 'next/link';
import { User } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  // Determine active navigation item based on current path
  const isDiscoverActive = pathname === '/';

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

        {/* Right: Navigation Items + Profile */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          <Link
            href="/"
            className={`
              font-albert text-[14px] md:text-[15px] px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-colors
              ${
                isDiscoverActive
                  ? 'bg-stone-800 text-white font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }
            `}
          >
            Discover
          </Link>
          <span
            className="font-albert text-[14px] md:text-[15px] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-stone-400 opacity-50 cursor-not-allowed"
          >
            Cookbook
          </span>
          <span
            className="font-albert text-[14px] md:text-[15px] px-3 md:px-4 py-1.5 md:py-2 rounded-full text-stone-400 opacity-50 cursor-not-allowed"
          >
            About
          </span>
          <span
            className="p-2 rounded-lg cursor-not-allowed opacity-50"
            aria-label="Profile"
          >
            <User className="w-5 h-5 text-stone-400" />
          </span>
        </div>
      </div>
    </div>
  );
}
