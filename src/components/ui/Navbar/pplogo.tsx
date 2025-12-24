'use client';

import Image from 'next/image';

export default function PPLogo() {
  return (
    <div className="w-14 h-14 flex items-center justify-center transition-all duration-300 ease-in-out group-hover:scale-110 group-hover:-rotate-12 group-active:scale-95">
      <Image
        src="/assets/icons/Fish Logo.svg"
        alt="Parse and Plate Logo"
        width={56}
        height={56}
        className="w-full h-full object-contain"
        priority
      />
    </div>
  );
}
