
import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UrlInputProps {
  onParseRecipe: (url: string) => void;
  isLoading: boolean;
}

const UrlInput = ({ onParseRecipe, isLoading }: UrlInputProps) => {
  const [url, setUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(true);

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateUrl(url)) {
      setIsValidUrl(true);
      onParseRecipe(url);
    } else {
      setIsValidUrl(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    if (newUrl && !validateUrl(newUrl)) {
      setIsValidUrl(false);
    } else {
      setIsValidUrl(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">
          Parse & Plate
        </h1>
        <p className="text-lg text-gray-600">
          Clean, ad-free recipes from any cooking website
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Input
            type="url"
            placeholder="Paste a recipe URL here..."
            value={url}
            onChange={handleUrlChange}
            className={`pl-12 pr-4 py-6 text-lg ${
              !isValidUrl ? 'border-red-500 focus:border-red-500' : ''
            }`}
            disabled={isLoading}
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        </div>
        
        {!isValidUrl && (
          <p className="text-red-500 text-sm ml-1">
            Please enter a valid URL
          </p>
        )}
        
        <Button
          type="submit"
          disabled={!url || !isValidUrl || isLoading}
          className="w-full py-6 text-lg font-semibold bg-orange-500 hover:bg-orange-600 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Parsing Recipe...
            </>
          ) : (
            'Parse Recipe'
          )}
        </Button>
      </form>
      
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          Try with popular recipe sites like AllRecipes, Food Network, or Bon Appétit
        </p>
      </div>
    </div>
  );
};

export default UrlInput;
