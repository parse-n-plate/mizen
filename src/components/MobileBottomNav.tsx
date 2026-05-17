"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import Home from "@solar-icons/react/csr/ui/Home";
import BookBookmark from "@solar-icons/react/csr/school/BookBookmark";
import User from "@solar-icons/react/csr/users/User";

type BaseMobileNavItem = {
  id: string;
  label: string;
  icon: ReactNode;
  active?: boolean;
  disabled?: boolean;
};

type MobileNavLinkItem = BaseMobileNavItem & {
  type: "link";
  href: string;
};

type MobileNavButtonItem = BaseMobileNavItem & {
  type: "button";
  onClick: () => void;
  pressed?: boolean;
};

export type MobileNavItem = MobileNavLinkItem | MobileNavButtonItem;

type MobileNavAction = {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
};

type MobileNavShellProps = {
  items: MobileNavItem[];
  action?: MobileNavAction;
  actionSlot?: ReactNode;
  className?: string;
};

function NavIconButton({ item, className }: { item: MobileNavItem; className?: string }) {
  const stateClass = item.active
    ? "bg-stone-100 text-[var(--color-text-heading)] shadow-[inset_0_0_0_1px_rgba(41,37,36,0.025)] dark:bg-stone-800 dark:text-stone-100"
    : "text-[var(--color-text-muted)] active:bg-stone-100 active:text-[var(--color-text-heading)] dark:active:bg-stone-800";

  const sharedClassName = cn(
    "press-scale inline-flex h-12 min-w-12 items-center justify-center rounded-full px-3 transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue)] disabled:pointer-events-none disabled:opacity-40",
    stateClass,
    className
  );

  if (item.type === "link") {
    return (
      <Link
        href={item.href}
        role="tab"
        aria-label={item.label}
        aria-selected={item.active}
        aria-current={item.active ? "page" : undefined}
        className={sharedClassName}
      >
        {item.icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      role="tab"
      aria-label={item.label}
      aria-selected={item.active}
      disabled={item.disabled}
      onClick={item.onClick}
      className={sharedClassName}
    >
      {item.icon}
    </button>
  );
}

function MobileNavTabLayer({ items }: { items: MobileNavItem[] }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1 rounded-full p-1" role="tablist">
      {items.map((item) => (
        <NavIconButton key={item.id} item={item} />
      ))}
    </div>
  );
}

function MobileNavPrimaryAction({ action }: { action: MobileNavAction }) {
  const className = cn(
    "press-scale inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-light)]/80 bg-[var(--color-surface)] text-[var(--color-text-heading)] shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue)] disabled:pointer-events-none disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100",
    action.active && "bg-stone-100 text-[var(--color-blue)] dark:bg-stone-800"
  );

  if (action.href) {
    return (
      <Link href={action.href} aria-label={action.label} className={className}>
        {action.icon}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={action.label}
      disabled={action.disabled}
      onClick={action.onClick}
      className={className}
    >
      {action.icon}
    </button>
  );
}

export function MobileNavShell({ items, action, actionSlot, className }: MobileNavShellProps) {
  return (
    <nav
      className={cn(
        "md:hidden print:hidden fixed inset-x-0 bottom-0 z-30 pointer-events-none",
        className
      )}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3">
        <div className="pointer-events-auto relative min-w-0 rounded-full border border-[var(--color-border-light)]/80 bg-[var(--color-surface)]/95 shadow-[0_12px_34px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/95">
          <MobileNavTabLayer items={items} />
        </div>
        {actionSlot ? (
          <div className="pointer-events-auto">{actionSlot}</div>
        ) : action ? (
          <div className="pointer-events-auto">
            <MobileNavPrimaryAction action={action} />
          </div>
        ) : null}
      </div>
    </nav>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  const items: MobileNavItem[] = [
    {
      id: "home",
      type: "link",
      href: "/",
      label: "Home",
      active: pathname === "/",
      icon: <Home size={22} aria-hidden="true" />,
    },
    {
      id: "cookbook",
      type: "link",
      href: "/cookbook",
      label: "Cookbook",
      active: pathname === "/cookbook",
      icon: <BookBookmark size={22} aria-hidden="true" />,
    },
    {
      id: "profile",
      type: "link",
      href: "/profile",
      label: "Profile",
      active: pathname === "/profile",
      icon: <User size={22} aria-hidden="true" />,
    },
  ];

  return <MobileNavShell items={items} />;
}
