
import React from 'react';
import { Clock, Users, ChefHat, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Recipe {
  title: string;
  image?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
  ingredients: string[];
  instructions: string[];
  source?: string;
}

interface RecipeDisplayProps {
  recipe: Recipe;
  onBack: () => void;
}

const RecipeDisplay = ({ recipe, onBack }: RecipeDisplayProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Search
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <div className="space-y-6">
          {/* Recipe Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {recipe.image && (
                  <div className="w-full md:w-1/3">
                    <img
                      src={recipe.image}
                      alt={recipe.title}
                      className="w-full h-48 md:h-full object-cover rounded-lg"
                    />
                  </div>
                )}
                
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    {recipe.title}
                  </h1>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    {recipe.prepTime && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4" />
                        Prep: {recipe.prepTime}
                      </div>
                    )}
                    {recipe.cookTime && (
                      <div className="flex items-center">
                        <ChefHat className="mr-1 h-4 w-4" />
                        Cook: {recipe.cookTime}
                      </div>
                    )}
                    {recipe.servings && (
                      <div className="flex items-center">
                        <Users className="mr-1 h-4 w-4" />
                        Serves: {recipe.servings}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Ingredients */}
            <Card className="shadow-lg border-0 bg-white">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                    <span className="text-sm">🥄</span>
                  </div>
                  Ingredients
                </h2>
                <div className="space-y-4">
                  {recipe.ingredients.map((ingredient, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                        <span className="text-gray-800 font-medium leading-relaxed">{ingredient}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Instructions
                </h2>
                <ol className="space-y-4">
                  {recipe.instructions.map((instruction, index) => (
                    <li key={index} className="flex">
                      <Badge variant="outline" className="mr-3 mt-1 flex-shrink-0">
                        {index + 1}
                      </Badge>
                      <span className="text-gray-700">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeDisplay;
