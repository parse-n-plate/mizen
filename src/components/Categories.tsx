import { Button } from "@/components/ui/button";

const categories = [
  "Asian",
  "Italian", 
  "Mexican",
  "Mediterranean",
  "French",
  "Indian",
  "Japanese",
  "Korean",
  "Hawaiian",
  "More 12+"
];

export default function Categories() {
  return (
    <div className="w-full overflow-x-auto py-4 scrollbar-hide">
      <div className="flex gap-3 justify-center min-w-max px-4">
        {categories.map((category) => (
          <Button
            key={category}
            variant="secondary"
            className="rounded-full bg-[#f3f4f6] hover:bg-[#e5e7eb] text-stone-800 border-none px-6 h-10 font-albert"
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}

