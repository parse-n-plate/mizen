'use client';

interface IngredientsCardProps {
  ingredients: string[];
}

export default function IngredientsCard({ ingredients }: IngredientsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-sm">
      <h3 className="font-albert font-medium text-[#1e1e1e] mb-3">Ingredients</h3>
      <ul className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <span className="text-[#0C0A09] mt-1.5">•</span>
            <span className="font-albert text-[#44403b]">{ingredient}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}









































