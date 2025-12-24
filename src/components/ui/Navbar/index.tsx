'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import Link from 'next/link';
import { Search, User } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCommandK } from '@/contexts/CommandKContext';

export default function Navbar() {
  const pathname = usePathname();
  const { open: openCommandK } = useCommandK();

  // Determine active navigation item based on current path
  const isDiscoverActive = pathname === '/';
  const isCookbookActive = pathname === '/cookbook';
  const isAboutActive = pathname === '/about';
  const isProfileActive = pathname === '/profile';

  return (
    <div className="bg-white px-4 md:px-6 py-3 md:py-4 sticky top-0 z-40 border-b border-stone-100">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 md:gap-6">
        {/* Left: Logo */}
        <div className="flex items-center flex-shrink-0">
          <Link 
            href="/" 
            className="group transition-all duration-300 ease-in-out"
          >
            <PPLogo />
          </Link>
        </div>

        {/* Center: Navigation Items */}
        <nav className="flex items-center gap-2 md:gap-3 flex-1 justify-center">
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
          <Link
            href="/cookbook"
            className={`
              font-albert text-[14px] md:text-[15px] px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-colors
              ${
                isCookbookActive
                  ? 'bg-stone-800 text-white font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }
            `}
          >
            Cookbook
          </Link>
          <Link
            href="/about"
            className={`
              font-albert text-[14px] md:text-[15px] px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-colors
              ${
                isAboutActive
                  ? 'bg-stone-800 text-white font-medium'
                  : 'text-stone-600 hover:text-stone-900'
              }
            `}
          >
            About
          </Link>
        </nav>

        {/* Right: Search Icon and Profile Icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => openCommandK()}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
            aria-label="Open search"
          >
            <Search className="w-5 h-5 text-stone-600" />
          </button>
          <Link
            href="/profile"
            className={`
              p-2 hover:bg-stone-100 rounded-lg transition-colors
              ${isProfileActive ? 'bg-stone-100' : ''}
            `}
            aria-label="Profile"
          >
            <User className="w-5 h-5 text-stone-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
