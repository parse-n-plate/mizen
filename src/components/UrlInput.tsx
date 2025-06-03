
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
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative border border-gray-300 rounded-lg bg-white shadow-sm">
          <div className="flex items-center">
            <Search className="absolute left-4 h-5 w-5 text-gray-400" />
            <Input
              type="url"
              placeholder="Paste a recipe URL here"
              value={url}
              onChange={handleUrlChange}
              className={`pl-12 pr-20 py-4 text-lg border-0 focus:ring-0 focus:outline-none ${
                !isValidUrl ? 'border-red-500' : ''
              }`}
              disabled={isLoading}
            />
            <Button
              type="submit"
              disabled={!url || !isValidUrl || isLoading}
              className="absolute right-2 h-10 px-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                '→'
              )}
            </Button>
          </div>
        </div>
        
        {!isValidUrl && (
          <p className="text-red-500 text-sm mt-2 ml-1">
            Please enter a valid URL
          </p>
        )}
      </form>
    </div>
  );
};

export default UrlInput;
