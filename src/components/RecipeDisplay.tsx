
import React, { useState } from 'react';
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
  const [viewMode, setViewMode] = useState<'compact' | 'expanded'>('compact');
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < recipe.instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

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
            
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'compact' ? 'default' : 'outline'}
                onClick={() => setViewMode('compact')}
                size="sm"
              >
                Compact
              </Button>
              <Button
                variant={viewMode === 'expanded' ? 'default' : 'outline'}
                onClick={() => setViewMode('expanded')}
                size="sm"
              >
                Step-by-Step
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        {viewMode === 'compact' ? (
          <CompactView recipe={recipe} />
        ) : (
          <ExpandedView 
            recipe={recipe} 
            currentStep={currentStep}
            onNextStep={nextStep}
            onPrevStep={prevStep}
          />
        )}
      </div>
    </div>
  );
};

const CompactView = ({ recipe }: { recipe: Recipe }) => (
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
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">
            Ingredients
          </h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="flex items-start">
                <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0" />
                <span className="text-gray-700">{ingredient}</span>
              </li>
            ))}
          </ul>
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
);

const ExpandedView = ({ 
  recipe, 
  currentStep, 
  onNextStep, 
  onPrevStep 
}: { 
  recipe: Recipe;
  currentStep: number;
  onNextStep: () => void;
  onPrevStep: () => void;
}) => (
  <div className="space-y-6">
    {/* Ingredients Reference */}
    <Card>
      <CardContent className="p-4">
        <h2 className="text-lg font-semibold mb-3">Ingredients</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          {recipe.ingredients.map((ingredient, index) => (
            <div key={index} className="flex items-center">
              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-2" />
              {ingredient}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    {/* Current Step */}
    <Card>
      <CardContent className="p-8 text-center">
        <div className="mb-4">
          <span className="text-sm text-gray-500">
            Step {currentStep + 1} of {recipe.instructions.length}
          </span>
        </div>
        
        <div className="text-xl leading-relaxed text-gray-800 mb-8">
          {recipe.instructions[currentStep]}
        </div>
        
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={onPrevStep}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {recipe.instructions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          
          <Button
            onClick={onNextStep}
            disabled={currentStep === recipe.instructions.length - 1}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {currentStep === recipe.instructions.length - 1 ? 'Complete' : 'Next'}
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default RecipeDisplay;
