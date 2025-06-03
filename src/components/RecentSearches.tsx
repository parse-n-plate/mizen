
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface RecentSearch {
  id: string;
  title: string;
  time: string;
  ingredients: number;
}

interface RecentSearchesProps {
  searches: RecentSearch[];
}

const RecentSearches = ({ searches }: RecentSearchesProps) => {
  return (
    <div className="mt-16">
      <h2 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
        Your Recent Searches
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {searches.map((search) => (
          <Card key={search.id} className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                {search.title}
              </h3>
              <div className="text-sm text-gray-500 space-y-1">
                <div>{search.time} | {search.ingredients} ingredients</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecentSearches;
