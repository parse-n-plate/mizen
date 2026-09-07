import { EmptyState } from "@/components/EmptyState";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState variant="notFound" />
    </div>
  );
}
