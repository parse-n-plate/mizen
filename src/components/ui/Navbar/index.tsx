import PPLogo from '@/components/ui/Navbar/pplogo';
import Link from 'next/link';
import NavbarSearch from '@/components/ui/Navbar/navbar-search';

/**
 * Navbar Component
 * 
 * Updated to match Figma design:
 * - Logo on the left
 * - Centered search bar (desktop)
 * - Auth buttons on the right
 * - Responsive layout for mobile
 */
export default function Navbar() {
  return (
    <div className="bg-white h-[96px] relative shrink-0 w-full border-b border-stone-200">
      {/* Desktop Layout */}
      <div className="hidden lg:block h-full">
        <div className="relative h-full max-w-[1440px] mx-auto">
          {/* Left: Logo */}
          <div className="absolute left-[48px] top-[24px]">
            <Link href="/" className="hover:opacity-80 transition-opacity">
              <PPLogo />
            </Link>
          </div>

          {/* Center: Search Bar - Positioned absolutely and centered */}
          <div className="absolute left-1/2 top-[24px] -translate-x-1/2 w-[600px]">
            <NavbarSearch />
          </div>

          {/* Right: Auth Buttons */}
          <nav className="absolute right-[48px] top-[24px] flex items-center gap-2.5 h-[48px]">
            {/* Sign In Button - Placeholder */}
            <button className="bg-white border-[1.225px] border-stone-200 text-black font-albert text-[14px] font-medium px-5 py-2 rounded-full hover:bg-stone-50 transition-all duration-200 active:scale-95">
              Sign In
            </button>

            {/* Get Started Button */}
            <button className="bg-[#154df6] hover:bg-[#0d3dcc] text-stone-50 font-albert text-[14px] font-medium px-5 py-2 rounded-full transition-all duration-200 active:scale-95">
              Get Started
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden flex items-center justify-between h-full px-4">
        {/* Left: Logo */}
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <PPLogo />
        </Link>

        {/* Right: Mobile menu and search - simplified for mobile */}
        <div className="flex items-center gap-2">
          {/* Mobile search button - opens search modal/dialog */}
          <button className="flex items-center justify-center size-10 rounded-full transition-all hover:bg-stone-100 active:scale-95">
            <svg
              className="size-5 text-stone-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Mobile menu button */}
          <button className="flex items-center justify-center size-10 rounded-full transition-all hover:bg-stone-100 active:scale-95">
            <svg
              className="size-6 text-stone-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
      <h1 className="font-sans text-lg self-center">📖 COOKBOOK</h1>
    </div>
  );
}
