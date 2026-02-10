'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { 
  Layout, 
  Search, 
  Terminal, 
  FlaskConical, 
  FileText, 
  ArrowRight,
  Construction,
  ChefHat
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function DashboardPage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {} as { params?: Promise<Record<string, string | string[]>>; searchParams?: Promise<Record<string, string | string[]>> }) {
  // For Next.js 15: Unwrap params/searchParams if provided to prevent enumeration warnings
  // This prevents React DevTools/error serialization from enumerating these props
   
  if (params) use(params);
   
  if (searchParams) use(searchParams);
  
  const tools = [
    {
      title: "Search Bar Experiment",
      description: "Testing new search interaction patterns and animations",
      href: "/test-search-bar",
      icon: <Search className="h-6 w-6 text-blue-500" />,
      status: "In Progress"
    },
    {
      title: "Recipe Directions",
      description: "Testing step-by-step cooking layouts with timers and ingredients per step",
      href: "/dashboard/recipe-directions",
      icon: <ChefHat className="h-6 w-6 text-purple-500" />,
      status: "In Progress"
    },
    {
      title: "Prompt Debugger",
      description: "Admin tool for testing and refining AI recipe parsing prompts",
      href: "/admin/debug-parser",
      icon: <Terminal className="h-6 w-6 text-orange-500" />,
      status: "Beta"
    },
    {
      title: "Recipe Parser",
      description: "Main application flow for parsing recipes",
      href: "/",
      icon: <FileText className="h-6 w-6 text-green-500" />,
      status: "Live"
    }
  ];

  return (
    <div className="min-h-screen bg-white p-8 md:p-12 font-albert text-[#37352F]">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Notion-style Header */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 bg-white rounded-lg shadow-sm flex items-center justify-center border border-[#E0E0E0]">
              <FlaskConical className="h-8 w-8 text-[#37352F]" />
            </div>
            <div>
              <h1 className="text-4xl font-domine font-bold tracking-tight text-[#37352F]">Design Lab</h1>
              <p className="text-[#787774] mt-2 flex items-center gap-2 font-albert">
                <Construction className="h-4 w-4" />
                Internal workspace for testing and iterations
              </p>
            </div>
          </div>
          
        {/* Notion-style Callout/Info block */}
        <div className="bg-white p-4 rounded-md border border-[#E0E0E0] flex gap-3 items-start">
          <span className="text-xl">💡</span>
          <div className="space-y-1">
            <p className="font-domine font-medium text-sm">About this workspace</p>
            <p className="font-albert text-sm text-[#787774]">
              This dashboard collects all active design experiments and admin tools. 
              Use these pages to test isolated components before integrating them into the main app.
            </p>
          </div>
        </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => (
            <Link href={tool.href} key={tool.href} className="block group">
              <Card className="h-full hover:bg-gray-50 transition-colors cursor-pointer border-[#E0E0E0] shadow-sm hover:shadow-md">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="p-2 bg-gray-100 rounded-md group-hover:bg-white transition-colors">
                    {tool.icon}
                  </div>
                  {tool.status && (
                    <span className={`text-xs px-2 py-1 rounded-full font-medium border font-albert
                      ${tool.status === 'Live' ? 'bg-green-50 text-green-700 border-green-200' : 
                        tool.status === 'Beta' ? 'bg-orange-50 text-orange-700 border-orange-200' : 
                        'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {tool.status}
                    </span>
                  )}
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-medium group-hover:underline decoration-1 underline-offset-4">
                      {tool.title}
                    </CardTitle>
                    <ArrowRight className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                  </div>
                  <CardDescription className="mt-2 text-[#787774]">
                    {tool.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent/Notes Section Placeholder - Notion Style */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E0E0E0] pb-2">
            <Layout className="h-4 w-4 text-[#787774]" />
            <h2 className="font-domine text-sm font-semibold text-[#787774] uppercase tracking-wider">Recent Iterations</h2>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 p-2 hover:bg-[#EBEBEB] rounded cursor-pointer text-sm text-[#37352F]">
              <span className="text-lg">🎨</span>
              <span className="font-albert">Updated color palette for recipe cards</span>
              <span className="ml-auto text-xs text-[#787774] font-albert">Yesterday</span>
            </div>
            <div className="flex items-center gap-2 p-2 hover:bg-[#EBEBEB] rounded cursor-pointer text-sm text-[#37352F]">
              <span className="text-lg">🔍</span>
              <span className="font-albert">Refined search bar animation timing</span>
              <span className="ml-auto text-xs text-[#787774] font-albert">2 days ago</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

