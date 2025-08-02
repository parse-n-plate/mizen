'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import Link from 'next/link';

export default function Navbar() {
  return (
    <div className="bg-white border-b border-[#d9d9d9] px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="hover:opacity-80 transition-opacity">
            <PPLogo />
          </Link>
          <h1 className="font-domine text-[16px] font-bold text-[#1e1e1e] leading-none">
            Parse and Plate
          </h1>
        </div>

        <nav className="flex items-center space-x-6">
          {/* Navigation items can be added here in the future */}
        </nav>
      </div>
    </div>
  );
}
