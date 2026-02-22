'use client';

import Image from 'next/image';

function AvatarLink({ profileUrl, imageSrc, alt, ariaLabel, className }: { profileUrl: string; imageSrc: string; alt: string; ariaLabel: string; className?: string; }) {
  return (
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={`relative w-[37px] h-[37px] rounded-full overflow-hidden border-2 border-stone-100 hover:border-stone-100 transition-all hover:scale-110 flex-shrink-0 ${className || ''}`}
    >
      <img
        src={imageSrc}
        alt={alt}
        width={37}
        height={37}
        className="object-cover rounded-full w-full h-full"
        draggable={false}
      />
    </a>
  );
}

export default function Footer() {
  // Social profile URLs for team members
  const linkedInProfiles = {
    gage: 'https://gageminamoto.vercel.app/',
    michelle: 'https://www.linkedin.com/in/michelle-tran-a48a14203/',
    will: 'https://www.linkedin.com/in/william-liang808/',
    rahul: 'https://linkedin.com/in/rahulj24',
  };

  return (
    // Footer wrapper: Full-width background with rounded top corners
    // This ensures the #FAFAF9 background fills edge-to-edge, eliminating negative space
    <footer className="hidden md:block bg-[#FAFAF9] w-full pt-6 md:pt-8 pb-12 md:pb-16 relative overflow-hidden rounded-t-[32px]">
      {/* Content container: Centered content with max-width constraint */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 relative z-10">
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
                    draggable={false}
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
                <AvatarLink
                  profileUrl={linkedInProfiles.gage}
                  imageSrc="/assets/avatars/Gage_Avatar.jpg"
                  alt="Gage"
                  ariaLabel="Visit Gage's profile"
                  className="z-10"
                />
                <AvatarLink
                  profileUrl={linkedInProfiles.michelle}
                  imageSrc="/assets/avatars/Michelle_Avatar.jpg"
                  alt="Michelle"
                  ariaLabel="Visit Michelle's profile"
                  className="z-20"
                />
                <AvatarLink
                  profileUrl={linkedInProfiles.will}
                  imageSrc="/assets/avatars/Will_Avatar.jpg"
                  alt="Will"
                  ariaLabel="Visit Will's profile"
                  className="z-30"
                />
                <AvatarLink
                  profileUrl={linkedInProfiles.rahul}
                  imageSrc="/assets/avatars/Rahul_Avatar.jpg"
                  alt="Rahul"
                  ariaLabel="Visit Rahul's profile"
                  className="z-40"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fish Illustration - positioned absolutely, extends from bottom half and gets cut off */}
      {/* Note: This is positioned relative to the footer, not the content container */}
      <div className="absolute right-0 w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] z-0 pointer-events-none" style={{ bottom: '-40%' }}>
        <div className="relative w-full h-full">
          <Image
            src="/assets/icons/Fish Logo.svg"
            alt="Fish Logo"
            fill
            className="object-contain object-bottom"
            priority
            draggable={false}
          />
        </div>
      </div>
    </footer>
  );
}
