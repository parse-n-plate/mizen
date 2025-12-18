'use client';

import { useState, useRef, useEffect, use } from 'react';
import { Search, Globe, ChefHat, X, ArrowRight, Command, Sparkles, MessageSquare, Layout, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function SearchBarTestingPage({
  params,
  searchParams,
}: {
  params?: Promise<Record<string, string | string[]>>;
  searchParams?: Promise<Record<string, string | string[]>>;
} = {} as any) {
  // For Next.js 15: Unwrap params/searchParams if provided to prevent enumeration warnings
  // This prevents React DevTools/error serialization from enumerating these props
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (params) use(params);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  if (searchParams) use(searchParams);
  
  return (
    <div className="min-h-screen bg-white py-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <div className="flex justify-center mb-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard" className="font-albert">Design Lab</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-albert">Search Bar Experiment</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <h1 className="font-albert text-4xl font-bold text-stone-900">Search Bar Design Iterations</h1>
          <p className="text-stone-600 font-albert">Testing different interaction models for URL input vs. Recipe Search</p>
        </div>

        <div className="grid gap-12">
          {/* Variation 1: Canva Style Toggle */}
          <VariationContainer
            title="Variation 1: Toggle Switch (Canva Style)"
            description="Prominent toggle above the search bar to switch between modes. Large, centered input."
          >
            <div className="font-albert w-full flex justify-center">
              <ToggleVariation />
            </div>
          </VariationContainer>

          {/* Variation 2: Dropdown Menu */}
          <VariationContainer
            title="Variation 2: Dropdown Selector (Perplexity Style)"
            description="Minimalist dropdown inside or near the search bar to switch contexts."
          >
            <div className="font-albert w-full flex justify-center">
              <DropdownVariation />
            </div>
          </VariationContainer>

           {/* Variation 3: Command Palette */}
           <VariationContainer
            title="Variation 3: Command Palette (Linear Style)"
            description="Modal overlay triggered by button or shortcut (⌘K). high density, power-user focused."
          >
            <div className="font-albert w-full flex justify-center">
              <CommandPaletteVariation />
            </div>
          </VariationContainer>

          {/* Variation 4: Conversational */}
          <VariationContainer
            title="Variation 4: Conversational (ChatGPT Style)"
            description="Bottom-anchored, natural language input that expands as you type."
          >
            <div className="font-albert w-full flex justify-center">
              <ConversationalVariation />
            </div>
          </VariationContainer>

          {/* Variation 5: Full Page Overlay */}
          <VariationContainer
            title="Variation 5: Full Page Overlay (Apple/Samsung Style)"
            description="Search takes over the entire screen for maximum focus."
          >
            <div className="font-albert w-full flex justify-center">
              <FullPageOverlayVariation />
            </div>
          </VariationContainer>
          
          {/* Variation 6: Slide-out Panel */}
           <VariationContainer
            title="Variation 6: Slide-out Panel"
            description="Search opens in a dedicated drawer on the side."
          >
            <div className="font-albert w-full flex justify-center">
              <SlideOutPanelVariation />
            </div>
          </VariationContainer>

          {/* Variation 7: Smart Auto-Detect */}
           <VariationContainer
            title="Variation 7: Smart Auto-Detect"
            description="Automatically detects if you're entering a URL or searching for a recipe."
          >
            <div className="font-albert w-full flex justify-center">
              <SmartAutoDetectVariation />
            </div>
          </VariationContainer>

        </div>
      </div>
    </div>
  );
}

function VariationContainer({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="border-b border-stone-200 pb-2">
        <h2 className="font-albert text-xl font-bold text-stone-800">{title}</h2>
        <p className="text-sm text-stone-500 font-albert">{description}</p>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 p-8 min-h-[200px] flex items-center justify-center shadow-sm">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}

// --- Variation 1: Toggle Switch (Canva Style - Expanded) ---
function ToggleVariation() {
  const [mode, setMode] = useState<'url' | 'recipe'>('url');
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="w-full flex flex-col items-center gap-6 relative z-20">
      {/* Toggle Switch - Fades out when expanded */}
      <div className={`bg-stone-100 p-1 rounded-full inline-flex relative transition-opacity duration-200 ${isExpanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        <div 
          className={`absolute top-1 bottom-1 w-[50%] bg-white rounded-full shadow-sm transition-all duration-300 ease-out ${
            mode === 'url' ? 'left-1' : 'left-[calc(50%-4px)] translate-x-1'
          }`}
        />
        <button
          onClick={() => setMode('url')}
          className={`relative z-10 px-6 py-2 rounded-full text-sm font-albert font-medium transition-colors duration-300 ${
            mode === 'url' ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Paste URL
        </button>
        <button
          onClick={() => setMode('recipe')}
          className={`relative z-10 px-6 py-2 rounded-full text-sm font-albert font-medium transition-colors duration-300 ${
            mode === 'recipe' ? 'text-stone-900' : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          Find Recipe
        </button>
      </div>

      {/* Search Input Container */}
      <div 
        className={`
          w-full relative transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isExpanded ? '-mt-[60px] shadow-2xl' : 'mt-0 shadow-none'}
        `}
      >
        {/* Main Box (Input + Expanded Area) */}
        <div className={`
            bg-white border border-stone-200 overflow-hidden transition-all duration-300
            ${isExpanded ? 'rounded-2xl ring-2 ring-stone-900/5 border-transparent' : 'rounded-full'}
          `}>
            
          {/* Top Input Section */}
          <div className="relative flex items-center p-2 z-10 bg-white">
            <div className="pl-4 pr-3 text-stone-400">
              {mode === 'url' ? <Globe className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
            </div>
            <input
              type="text"
              placeholder={mode === 'url' ? "Paste a recipe URL (e.g. nytimes.com/...)" : "Search recipes or describe what you want to cook..."}
              className="flex-1 py-3 text-stone-800 placeholder:text-stone-400 outline-none bg-transparent font-albert text-lg"
              onFocus={() => setIsExpanded(true)}
            />
            
            {isExpanded ? (
               <Button 
                variant="ghost"
                size="icon" 
                onClick={() => setIsExpanded(false)}
                className="mr-2 text-stone-400 hover:text-stone-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
            ) : (
              <Button 
                size="icon" 
                className={`
                  rounded-full w-10 h-10 mr-1 transition-all duration-300 
                  ${mode === 'url' ? 'bg-stone-900 hover:bg-stone-800' : 'bg-indigo-600 hover:bg-indigo-700'}
                `}
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </Button>
            )}
          </div>

          {/* Expanded Content Area */}
          <div className={`
             w-full bg-white transition-all duration-300 ease-in-out border-t border-stone-100
             ${isExpanded ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}
          `}>
            <div className="p-4 space-y-6 overflow-y-auto max-h-[400px]">
              
              {/* Filter Pills */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">Filters</p>
                <div className="flex flex-wrap gap-2">
                   {['Breakfast', 'Dinner', 'Vegetarian', 'Quick', 'Healthy', 'Dessert'].map(tag => (
                     <button key={tag} className="px-3 py-1.5 bg-stone-50 hover:bg-stone-100 text-stone-600 text-sm font-medium rounded-lg transition-colors border border-stone-200">
                       {tag}
                     </button>
                   ))}
                </div>
              </div>

              {/* Suggestions / Recent */}
              <div className="space-y-2">
                 <p className="text-xs font-bold text-stone-400 uppercase tracking-wider px-1">Suggestions</p>
                 <div className="space-y-1">
                    {[
                      { icon: Search, text: "Chicken Parmesan" },
                      { icon: Search, text: "Chocolate Chip Cookies" },
                      { icon: Globe, text: "nytimes.com/recipes/..." },
                      { icon: ChefHat, text: "My Saved Recipes" }
                    ].map((item, i) => (
                      <button key={i} className="w-full flex items-center gap-3 p-2 hover:bg-stone-50 rounded-lg text-left transition-colors group">
                        <item.icon className="w-4 h-4 text-stone-400 group-hover:text-stone-600" />
                        <span className="text-stone-700 font-medium">{item.text}</span>
                      </button>
                    ))}
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Variation 2: Dropdown Selector ---
function DropdownVariation() {
  const [mode, setMode] = useState<'url' | 'recipe'>('url');
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="w-full max-w-xl mx-auto">
      <div 
        className={`
          relative flex items-center bg-white rounded-lg border transition-all duration-200
          ${isFocused ? 'border-stone-400 shadow-md ring-1 ring-stone-100' : 'border-stone-200 shadow-sm hover:border-stone-300'}
        `}
      >
        {/* Dropdown Trigger */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-4 py-3 border-r border-stone-100 hover:bg-stone-50 transition-colors rounded-l-lg text-stone-600 font-albert font-medium text-sm"
          >
            {mode === 'url' ? (
              <>
                <Globe className="w-4 h-4" />
                <span>URL</span>
              </>
            ) : (
              <>
                <ChefHat className="w-4 h-4" />
                <span>Recipe</span>
              </>
            )}
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <div className="absolute top-[calc(100%+8px)] left-0 w-40 bg-white rounded-lg border border-stone-100 shadow-xl py-1 z-20 animate-in fade-in slide-in-from-top-2 duration-200">
              <button
                onClick={() => { setMode('url'); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${mode === 'url' ? 'text-indigo-600 bg-indigo-50/50' : 'text-stone-600'}`}
              >
                <Globe className="w-4 h-4" />
                URL Input
              </button>
              <button
                onClick={() => { setMode('recipe'); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-stone-50 transition-colors ${mode === 'recipe' ? 'text-indigo-600 bg-indigo-50/50' : 'text-stone-600'}`}
              >
                <ChefHat className="w-4 h-4" />
                Recipe Search
              </button>
            </div>
          )}
        </div>

        {/* Input */}
        <input
          type="text"
          className="flex-1 px-4 py-3 outline-none bg-transparent text-stone-800 placeholder:text-stone-400 font-albert"
          placeholder={mode === 'url' ? "https://..." : "What do you want to cook?"}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />

        {/* Action Icon */}
        <div className="pr-2">
          <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-600">
            <Search className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// --- Variation 3: Command Palette ---
function CommandPaletteVariation() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'url' | 'search'>('url');

  return (
    <div className="w-full flex flex-col items-center gap-4">
       <Button 
        variant="outline" 
        className="w-full max-w-md justify-between text-stone-500 font-albert font-normal hover:text-stone-700 hover:border-stone-400 transition-all"
        onClick={() => setIsOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="w-4 h-4" />
          Search or paste URL...
        </span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Modal Overlay (Simulated inline for demo) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-stone-200">
            {/* Header / Tabs */}
            <div className="flex items-center border-b border-stone-100 px-2 pt-2">
              <button 
                onClick={() => setActiveTab('url')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'url' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
              >
                <Globe className="w-4 h-4" />
                Paste URL
              </button>
              <button 
                onClick={() => setActiveTab('search')}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === 'search' ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-700'}`}
              >
                <Search className="w-4 h-4" />
                Search Recipes
              </button>
            </div>
            
            {/* Input Area */}
            <div className="p-4">
              <div className="relative flex items-center gap-3">
                <Command className="w-5 h-5 text-stone-400" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder={activeTab === 'url' ? "Paste recipe URL..." : "Type to search recipes..."}
                  className="flex-1 text-lg outline-none placeholder:text-stone-400 text-stone-900"
                />
                <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                  <span className="text-xs text-stone-500">ESC</span>
                </Button>
              </div>
            </div>

            {/* Footer / Hints */}
            <div className="bg-stone-50 px-4 py-2 text-xs text-stone-500 flex justify-between items-center border-t border-stone-100">
              <div className="flex gap-3">
                <span>Parse URL</span>
                <span>Search</span>
                <span>Recent</span>
              </div>
              <div className="flex items-center gap-1">
                Select <span className="font-mono">↵</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

// --- Variation 4: Conversational ---
function ConversationalVariation() {
  const [input, setInput] = useState('');
  
  return (
    <div className="w-full max-w-2xl flex flex-col gap-4">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-lg p-4 transition-all duration-300 focus-within:ring-2 focus-within:ring-stone-900/5 focus-within:border-stone-300">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste a recipe URL or ask me to find a recipe for you..."
          className="w-full resize-none outline-none text-stone-800 placeholder:text-stone-400 font-albert text-base min-h-[60px]"
          rows={input.length > 50 ? 3 : 1}
        />
        
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-stone-100">
          <div className="flex gap-2">
             <Button variant="ghost" size="sm" className="h-8 px-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg">
                <Globe className="w-4 h-4 mr-2" />
                URL
             </Button>
             <Button variant="ghost" size="sm" className="h-8 px-2 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg">
                <Sparkles className="w-4 h-4 mr-2" />
                AI
             </Button>
          </div>
          <Button 
            size="icon" 
            className={`h-8 w-8 rounded-lg transition-all duration-200 ${input ? 'bg-stone-900' : 'bg-stone-200 text-stone-400'}`}
            disabled={!input}
          >
            <ArrowRight className={`w-4 h-4 ${input ? 'text-white' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="flex justify-center gap-4 text-xs text-stone-400 font-albert">
        <span className="hover:text-stone-600 cursor-pointer transition-colors">"Quick dinner ideas"</span>
        <span className="hover:text-stone-600 cursor-pointer transition-colors">"Healthy breakfast"</span>
        <span className="hover:text-stone-600 cursor-pointer transition-colors">"Paste from NYTimes"</span>
      </div>
    </div>
  );
}

// --- Variation 5: Full Page Overlay ---
function FullPageOverlayVariation() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full flex justify-center">
      <Button 
        variant="outline" 
        className="px-8 py-6 rounded-full border-stone-200 shadow-sm hover:shadow-md transition-all text-stone-500 gap-3 text-lg font-normal w-full max-w-lg justify-start"
        onClick={() => setIsOpen(true)}
      >
        <Search className="w-5 h-5" />
        Tap to search...
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-md animate-in fade-in duration-300 flex flex-col items-center pt-[20vh]">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-6 right-6 h-12 w-12 rounded-full bg-stone-100 hover:bg-stone-200"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="w-full max-w-3xl px-6 animate-in slide-in-from-bottom-8 duration-500">
             <h2 className="text-center font-albert text-3xl mb-8 text-stone-900">What are we cooking today?</h2>
             
             <div className="relative">
               <input 
                 autoFocus
                 type="text"
                 className="w-full bg-transparent border-b-2 border-stone-200 focus:border-stone-900 outline-none py-4 text-3xl font-albert text-center placeholder:text-stone-300 transition-colors"
                 placeholder="Paste URL or search..."
               />
             </div>

             <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-center space-y-2 group">
                  <div className="mx-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="font-medium text-sm">From URL</p>
                </div>
                <div className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-center space-y-2 group">
                  <div className="mx-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <ChefHat className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="font-medium text-sm">My Recipes</p>
                </div>
                 <div className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-center space-y-2 group">
                  <div className="mx-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <p className="font-medium text-sm">Generate</p>
                </div>
                 <div className="p-4 rounded-xl bg-stone-50 hover:bg-stone-100 cursor-pointer transition-colors text-center space-y-2 group">
                  <div className="mx-auto w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                    <Layout className="w-5 h-5 text-green-500" />
                  </div>
                  <p className="font-medium text-sm">Browse</p>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Variation 6: Slide-Out Panel ---
function SlideOutPanelVariation() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="w-full flex justify-center">
             <Button 
                onClick={() => setIsOpen(true)}
                className="bg-white border border-stone-200 shadow-sm text-stone-900 hover:bg-stone-50 px-6 py-6 h-auto rounded-xl flex items-center gap-3 w-full max-w-lg justify-between group"
            >
                <div className="flex items-center gap-3">
                    <Search className="w-5 h-5 text-stone-400 group-hover:text-stone-600 transition-colors" />
                    <span className="text-stone-500 group-hover:text-stone-700">Search or paste URL...</span>
                </div>
                <PanelRight className="w-5 h-5 text-stone-300 group-hover:text-stone-500 transition-colors" />
            </Button>

            {/* Drawer */}
            {isOpen && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-[1px] animate-in fade-in duration-300"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="fixed top-0 right-0 h-full w-[400px] bg-white z-50 shadow-2xl border-l border-stone-100 p-6 animate-in slide-in-from-right duration-300 flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="font-albert text-xl font-bold">Search</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        <div className="space-y-4">
                             <div className="relative">
                                <Search className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                                <input 
                                    autoFocus
                                    type="text" 
                                    placeholder="Paste URL or search..."
                                    className="w-full bg-stone-50 border border-stone-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:border-stone-400 focus:ring-2 focus:ring-stone-100 transition-all"
                                />
                             </div>

                             <div className="flex gap-2 overflow-x-auto pb-2">
                                <span className="whitespace-nowrap px-3 py-1 bg-stone-100 rounded-full text-xs font-medium text-stone-600 border border-stone-200">Recently Viewed</span>
                                <span className="whitespace-nowrap px-3 py-1 bg-white rounded-full text-xs font-medium text-stone-500 border border-stone-200 hover:bg-stone-50 cursor-pointer">Saved</span>
                                <span className="whitespace-nowrap px-3 py-1 bg-white rounded-full text-xs font-medium text-stone-500 border border-stone-200 hover:bg-stone-50 cursor-pointer">Parsed</span>
                             </div>

                             <div className="space-y-2 pt-4">
                                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Recent</p>
                                <div className="space-y-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-stone-50 cursor-pointer transition-colors group">
                                            <div className="w-10 h-10 bg-stone-200 rounded-md shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-stone-800 truncate">Spicy Miso Ramen</p>
                                                <p className="text-xs text-stone-500 truncate">nytimes.com • 2 days ago</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// --- Variation 7: Smart Auto-Detect ---
function SmartAutoDetectVariation() {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'detecting' | 'url' | 'search'>('detecting');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!input.trim()) {
      setMode('detecting');
      return;
    }

    const isUrl = 
      input.includes('http') || 
      input.includes('www.') || 
      input.includes('.com') || 
      input.includes('.org') ||
      input.includes('.net');

    setMode(isUrl ? 'url' : 'search');
  }, [input]);

  return (
    <div className="w-full max-w-xl mx-auto">
       <div className={`
          relative flex items-center bg-white rounded-full border transition-all duration-300 overflow-hidden
          ${isFocused ? 'border-stone-400 shadow-lg ring-4 ring-stone-100' : 'border-stone-200 shadow-sm hover:border-stone-300'}
       `}>
          
          {/* Dynamic Icon Indicator */}
          <div className="pl-4 pr-2 transition-all duration-300">
             <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
                ${mode === 'url' ? 'bg-[#80C8FF]/10 text-[#80C8FF]' : 
                  mode === 'search' ? 'bg-[#4EAF46]/10 text-[#4EAF46]' : 
                  'bg-stone-50 text-stone-400'}
             `}>
                {mode === 'url' ? <Globe className="w-5 h-5" /> : 
                 mode === 'search' ? <ChefHat className="w-5 h-5" /> : 
                 <Search className="w-5 h-5" />}
             </div>
          </div>

          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste a recipe link or type what you want to cook..."
            className="flex-1 py-4 outline-none bg-transparent text-lg font-albert text-stone-800 placeholder:text-stone-400"
          />

          {/* Contextual Action Button */}
          <div className="pr-2">
             <Button 
               size="default" 
               className={`
                 rounded-full px-6 transition-all duration-300 font-medium
                 ${!input ? 'opacity-0 scale-90 pointer-events-none' : 'opacity-100 scale-100'}
                 ${mode === 'url' ? 'bg-[#80C8FF] hover:bg-[#80C8FF]/90 text-white' : 'bg-[#4EAF46] hover:bg-[#4EAF46]/90 text-white'}
               `}
             >
               {mode === 'url' ? 'Parse Recipe' : 'Search'}
             </Button>
          </div>
       </div>
       
       {/* Helper Text */}
       <div className="text-center mt-4 h-6">
         <p className={`text-xs font-medium transition-all duration-300 ${input ? 'opacity-100 transform-none' : 'opacity-0 translate-y-2'}`}>
           {mode === 'url' && <span className="text-[#80C8FF]">URL detected • Ready to parse</span>}
           {mode === 'search' && <span className="text-[#4EAF46]">Search query • Find recipes</span>}
         </p>
       </div>
    </div>
  );
}
