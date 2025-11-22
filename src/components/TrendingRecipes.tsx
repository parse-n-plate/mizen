import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

const trendingRecipes = [
  {
    title: "Beef Udon",
    author: "Namiko Hirasawa Chen",
    image: "/assets/images/beef-udon.jpg", // Placeholder path
    category: "Asian"
  },
  {
    title: "Garlic Shrimp Ramen", 
    author: "Cameron Tillman",
    image: "/assets/images/ramen.jpg", // Placeholder path
    category: "Asian"
  },
  {
    title: "Mushroom Risotto",
    author: "Darrell Schroeder",
    image: "/assets/images/risotto.jpg", // Placeholder path
    category: "Italian" // Note: Figma showed this under Asian but Risotto is Italian. Keeping as per Figma or fixing? Figma showed it in the row. I'll stick to the visual row.
  },
  {
    title: "Beef Udon",
    author: "Namiko Hirasawa Chen",
    image: "/assets/images/beef-udon.jpg",
    category: "Asian"
  },
  {
    title: "Beef Udon", 
    author: "Namiko Hirasawa Chen",
    image: "/assets/images/beef-udon.jpg",
    category: "Asian"
  }
];

export default function TrendingRecipes() {
  return (
    <div className="w-full py-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🍅</span>
        <h2 className="font-domine text-3xl text-stone-900">Asian</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingRecipes.slice(0, 3).map((recipe, index) => (
          <div key={index} className="group cursor-pointer">
            <Card className="border border-stone-200 overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="relative aspect-[4/3] bg-stone-200">
                {/* 
                  Using a colored div as placeholder since we don't have the actual images yet.
                  In a real app, this would be next/image
                */}
                <div className="absolute inset-0 bg-stone-200 flex items-center justify-center text-stone-400">
                  Image Placeholder
                </div>
              </div>
              <CardContent className="p-4 bg-[#FDFBF7]">
                <h3 className="font-domine text-xl text-stone-900 mb-1 group-hover:text-[#4F46E5] transition-colors">
                  {recipe.title}
                </h3>
                <p className="font-albert text-sm text-stone-500">
                  By {recipe.author}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
      
      {/* Second row for more items if needed, matching the Figma layout which shows a grid */}
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {trendingRecipes.slice(3, 5).map((recipe, index) => (
          <div key={index + 3} className="group cursor-pointer">
             <Card className="border border-stone-200 overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="relative aspect-[2/1] bg-stone-200">
                 <div className="absolute inset-0 bg-stone-200 flex items-center justify-center text-stone-400">
                  Image Placeholder
                </div>
              </div>
              <CardContent className="p-4 bg-[#FDFBF7]">
                <h3 className="font-domine text-xl text-stone-900 mb-1 group-hover:text-[#4F46E5] transition-colors">
                  {recipe.title}
                </h3>
                <p className="font-albert text-sm text-stone-500">
                  By {recipe.author}
                </p>
              </CardContent>
            </Card>
          </div>
        ))}
       </div>
    </div>
  );
}

