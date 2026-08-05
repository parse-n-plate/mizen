"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import Home from "@solar-icons/react/csr/ui/Home";
import BookBookmark from "@solar-icons/react/csr/school/BookBookmark";
import Magnifer from "@solar-icons/react/csr/search/Magnifer";
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
  showLabels?: boolean;
};

function subscribeToHydration() {
  return () => {};
}

function NavIconButton({
  item,
  className,
  showLabel = false,
}: {
  item: MobileNavItem;
  className?: string;
  showLabel?: boolean;
}) {
  const stateClass = item.active
    ? "bg-stone-100 text-[var(--color-text-heading)] shadow-[inset_0_0_0_1px_rgba(41,37,36,0.025)] dark:bg-stone-800 dark:text-stone-100"
    : "text-[var(--color-text-muted)] active:bg-stone-100 active:text-[var(--color-text-heading)] dark:active:bg-stone-800";

  const sharedClassName = cn(
    "press-scale inline-flex h-12 items-center justify-center rounded-full transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue)] disabled:pointer-events-none disabled:opacity-40",
    showLabel ? "min-w-[5.75rem] gap-1.5 px-4 font-sans text-xs font-semibold" : "min-w-16 px-4",
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
        {showLabel && <span>{item.label}</span>}
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
      {showLabel && <span>{item.label}</span>}
    </button>
  );
}

function MobileNavTabLayer({
  items,
  showLabels,
}: {
  items: MobileNavItem[];
  showLabels?: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1 rounded-full p-1" role="tablist">
      {items.map((item) => (
        <NavIconButton key={item.id} item={item} showLabel={showLabels} />
      ))}
    </div>
  );
}

function MobileNavPrimaryAction({ action }: { action: MobileNavAction }) {
  const className = cn(
    "press-scale inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-light)]/80 bg-[var(--color-surface)] text-[var(--color-text-heading)] shadow-[0_12px_30px_rgba(0,0,0,0.08)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-blue)] disabled:pointer-events-none disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100",
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

export function MobileNavShell({
  items,
  action,
  actionSlot,
  className,
  showLabels,
}: MobileNavShellProps) {
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false
  );

  const navigation = (
    <nav
      className={cn(
        "md:hidden print:hidden fixed inset-x-0 bottom-0 z-30 pointer-events-none",
        className
      )}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-3 px-4 pb-[calc(env(safe-area-inset-bottom)+2rem)] pt-3">
        <div className="pointer-events-auto relative min-w-0 rounded-full border border-[var(--color-border-light)]/80 bg-[var(--color-surface)]/95 p-1.5 shadow-[0_12px_34px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-stone-700 dark:bg-stone-900/95">
          <MobileNavTabLayer items={items} showLabels={showLabels} />
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

  // Recipe content scrolls inside the app shell. Portaling prevents that scrolling
  // container from becoming the fixed-position containing block on mobile browsers.
  return isHydrated ? createPortal(navigation, document.body) : navigation;
}

export function MobileBottomNav({ searchHref }: { searchHref?: string }) {
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
      label: "Settings",
      active: pathname === "/profile",
      icon: <User size={22} aria-hidden="true" />,
    },
  ];

  return (
    <MobileNavShell
      items={items}
      action={
        searchHref
          ? {
              label: "Search",
              icon: <Magnifer size={22} aria-hidden="true" />,
              href: searchHref,
            }
          : undefined
      }
    />
  );
}
