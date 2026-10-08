import { UsersRound } from "lucide-react";

type ServingsIconProps = {
  className?: string;
};

/** Two-person icon used wherever servings are shown (matches the recipe toolbar control). */
export function ServingsIcon({ className }: ServingsIconProps) {
  return <UsersRound className={className} aria-hidden="true" />;
}
