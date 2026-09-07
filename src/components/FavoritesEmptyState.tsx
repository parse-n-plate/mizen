import { EmptyState } from "@/components/EmptyState";

export function FavoritesEmptyState({ unavailable = false }: { unavailable?: boolean }) {
  return <EmptyState variant={unavailable ? "favoritesError" : "favorites"} alert={unavailable} />;
}
