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

export function Footer() {
  return (
    <footer className="w-full px-6 py-12">
      <div className="mx-auto flex max-w-3xl items-center justify-between">
        <div className="flex items-center gap-1.5">
          <p className="font-sans text-sm text-stone-400">
            Cooked with love by
          </p>
          <div className="flex -space-x-2">
            {team.map((person) => (
              <Link
                key={person.name}
                href={person.href}
                target="_blank"
                rel="noopener noreferrer"
                className="relative h-7 w-7 flex-shrink-0 overflow-hidden rounded-full border-2 border-white transition-transform hover:scale-110 dark:border-stone-950"
                aria-label={`Visit ${person.name}'s profile`}
              >
                <Image
                  src={person.src}
                  alt={person.name}
                  width={28}
                  height={28}
                  className="rounded-full object-cover"
                  draggable={false}
                />
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/privacy"
            className="font-sans text-sm text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="font-sans text-sm text-stone-400 transition-colors hover:text-stone-600 dark:hover:text-stone-300"
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}
