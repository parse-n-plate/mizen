'use client';

import { User } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 md:px-8 pt-12 md:pt-16">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full overflow-hidden">
            <Image
              src="/assets/icons/Fish Logo.svg"
              alt="Profile"
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="font-domine text-[28px] md:text-[32px] font-normal text-black">
              Gage Minamoto
            </h1>
            <p className="font-albert text-stone-500">
              Profile settings coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
