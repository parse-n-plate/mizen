import Image from "next/image";
import Link from "next/link";

const team = [
  {
    name: "Gage",
    src: "/assets/avatars/Gage_Avatar.jpg",
    href: "https://gageminamoto.vercel.app/",
  },
  {
    name: "Michelle",
    src: "/assets/avatars/Michelle_Avatar.jpg",
    href: "https://www.linkedin.com/in/michelle-tran-a48a14203/",
  },
  {
    name: "Will",
    src: "/assets/avatars/Will_Avatar.jpg",
    href: "https://www.linkedin.com/in/william-liang808/",
  },
];

interface WhoMadeItProps {
  borderColor?: string;
}

export function WhoMadeIt({ borderColor }: WhoMadeItProps) {
  const borderClass = borderColor || "border-white dark:border-stone-950";

  return (
    <div className="flex items-center gap-1.5">
      <p className="font-sans text-xs text-stone-400 dark:text-stone-500">Cooked with love by</p>
      <div className="flex -space-x-2">
        {team.map((person) => (
          <Link
            key={person.name}
            href={person.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`relative h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border transition-transform hover:scale-110 ${borderClass}`}
            aria-label={`Visit ${person.name}'s profile`}
          >
            <Image
              src={person.src}
              alt={person.name}
              width={24}
              height={24}
              className="rounded-full object-cover"
              draggable={false}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
