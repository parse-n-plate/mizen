import Image from "next/image";
import Link from "next/link";
import content from "@/components/empty-state/content.json";

type EmptyStateProps = {
  variant: keyof typeof content;
  compact?: boolean;
  onAction?: () => void;
  alert?: boolean;
};

export function EmptyState({ variant, compact = false, onAction, alert = false }: EmptyStateProps) {
  const state: {
    title: string;
    description: string;
    illustration: string;
    action: string;
    href?: string;
  } = content[variant];
  const Heading = compact ? "h3" : "h2";
  return (
    <div
      className={`empty-state${compact ? " empty-state--compact" : ""}`}
      role={alert ? "alert" : undefined}
    >
      <Image
        className="empty-state__illustration"
        src={state.illustration}
        width={96}
        height={80}
        alt=""
        aria-hidden="true"
        unoptimized
      />
      <div className="empty-state__copy">
        <Heading className="empty-state__title">{state.title}</Heading>
        <p className="empty-state__description">{state.description}</p>
      </div>
      {onAction ? (
        <button type="button" className="empty-state__action" onClick={onAction}>
          {state.action}
        </button>
      ) : state.href ? (
        <Link className="empty-state__action" href={state.href}>
          {state.action}
        </Link>
      ) : null}
    </div>
  );
}
