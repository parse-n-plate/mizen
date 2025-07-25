'use client';

import PPLogo from '@/components/ui/Navbar/pplogo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-[#d9d9d9] px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <PPLogo />
          <h1 className="font-domine text-[16px] font-bold text-[#1e1e1e] leading-none">
            Parse and Plate
          </h1>
        </div>

        <nav className="flex items-center space-x-6">
          <Link
            href="/"
            className={`font-albert text-[14px] transition-colors ${
              pathname === '/'
                ? 'text-[#ffa424] font-medium'
                : 'text-[#1e1e1e] hover:text-[#ffa424]'
            }`}
          >
            Home
          </Link>
        </nav>
      </div>
    </div>
  );
}
