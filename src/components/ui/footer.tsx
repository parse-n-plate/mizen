'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Footer() {
  // Social profile URLs for team members
  const linkedInProfiles = {
    gage: 'https://gageminamoto.vercel.app/',
    michelle: 'https://www.linkedin.com/in/michelle-tran-a48a14203/',
    will: 'https://www.linkedin.com/in/william-liang808/',
  };

  return (
    <footer className="bg-[#FAFAF9] max-w-6xl mx-auto pt-6 md:pt-8 pb-12 md:pb-16 px-4 md:px-8 relative overflow-hidden rounded-t-[32px]">
      {/* Content container */}
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 md:gap-8 relative min-h-[250px] md:min-h-[300px]">
          {/* Left Section: Branding and Team Info */}
          <div className="flex flex-col gap-6 md:gap-8 w-full items-start justify-start relative z-10">
            {/* Brand Section: Pan Logo + Title */}
            <div className="flex flex-col gap-[10px]">
              <div className="flex items-center gap-[10px]">
                {/* Pan Logo Icon - 36px based on Figma */}
                <div className="relative w-9 h-9 flex-shrink-0">
                  <Image
                    src="/assets/icons/Pan_Icon.png"
                    alt="Pan Icon"
                    width={36}
                    height={36}
                    className="object-contain"
                  />
                </div>
                {/* Title */}
                <h2 className="font-domine text-[36px] font-normal leading-[1.1] text-stone-950">
                  Mizen
                </h2>
              </div>
              {/* Prep, Cook, Plate Subtitle */}
              <p className="font-albert text-[24px] font-normal leading-[1.1] text-stone-500">
                Prep, Cook, Plate
              </p>
            </div>

            {/* Team Section: Cooked with love by + Avatars */}
            <div className="flex items-center gap-3 flex-nowrap">
              <p className="font-albert text-[16px] font-normal leading-[1.1] text-stone-500 whitespace-nowrap">
                Cooked with love by
              </p>
              {/* Avatar Group - slightly overlapping based on Figma design */}
              <div className="flex items-start justify-start w-full -space-x-2">
                {/* Gage Avatar */}
                <Link
                  href={linkedInProfiles.gage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-[37px] h-[37px] rounded-full overflow-hidden border-2 border-stone-100 hover:border-stone-100 transition-all hover:scale-110 flex-shrink-0 z-10"
                  aria-label="Visit Gage's LinkedIn profile"
                >
                  <Image
                    src="/assets/avatars/Gage_Avatar.jpg"
                    alt="Gage"
                    width={37}
                    height={37}
                    className="object-cover rounded-full"
                  />
                </Link>
                {/* Michelle Avatar */}
                <Link
                  href={linkedInProfiles.michelle}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-[37px] h-[37px] rounded-full overflow-hidden border-2 border-stone-100 hover:border-stone-100 transition-all hover:scale-110 flex-shrink-0 z-20"
                  aria-label="Visit Michelle's LinkedIn profile"
                >
                  <Image
                    src="/assets/avatars/Michelle_Avatar.jpg"
                    alt="Michelle"
                    width={37}
                    height={37}
                    className="object-cover rounded-full"
                  />
                </Link>
                {/* Will Avatar */}
                <Link
                  href={linkedInProfiles.will}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-[37px] h-[37px] rounded-full overflow-hidden border-2 border-stone-100 hover:border-stone-100 transition-all hover:scale-110 flex-shrink-0 z-30"
                  aria-label="Visit Will's LinkedIn profile"
                >
                  <Image
                    src="/assets/avatars/Will_Avatar.jpg"
                    alt="Will"
                    width={37}
                    height={37}
                    className="object-cover rounded-full"
                  />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fish Illustration - positioned absolutely, extends from bottom half and gets cut off */}
      <div className="absolute right-0 w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] z-0 pointer-events-none" style={{ bottom: '-40%' }}>
        <div className="relative w-full h-full">
          <Image
            src="/assets/icons/Fish Logo.svg"
            alt="Fish Logo"
            fill
            className="object-contain object-bottom"
            priority
          />
        </div>
      </div>
      </footer>
  );
}
