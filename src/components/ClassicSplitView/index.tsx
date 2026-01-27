'use client';

import { useState, useEffect, useRef } from 'react';
import { RecipeStep } from './types';
import ListView from './ListView';
import CardView from './CardView';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { MoreHorizontal, Search, Link2, FileText, Edit, Check } from 'lucide-react';
import List from '@solar-icons/react/csr/list/List';
import Book from '@solar-icons/react/csr/school/Book';
import { useUISettings } from '@/contexts/UISettingsContext';
import { useRecipe } from '@/contexts/RecipeContext';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ClassicSplitViewProps {
  steps: RecipeStep[];
  title?: string;
  allIngredients?: any[]; // To handle flattened ingredients
}

export default function ClassicSplitView({ steps, title = 'Recipe Steps', allIngredients = [] }: ClassicSplitViewProps) {
  const [view, setView] = useState<'list' | 'card'>('list');
  const [currentStep, setCurrentStep] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRecipe, setCopiedRecipe] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const { settings, setStepSizing, setFontFamily } = useUISettings();
  const { parsedRecipe } = useRecipe();

  // Handler functions - must be defined before useEffects that reference them
  const handleCopyLink = async () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      try {
        await navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } catch (err) {
        console.error('Failed to copy link:', err);
      }
    }
  };

  const handleCopyRecipe = async () => {
    if (!parsedRecipe) return;
    
    // Format recipe as plain text
    let text = '';
    
    // Title
    if (parsedRecipe.title) {
      text += `${parsedRecipe.title}\n\n`;
    }
    
    // Metadata
    if (parsedRecipe.author) {
      text += `By ${parsedRecipe.author}\n`;
    }
    if (parsedRecipe.sourceUrl) {
      text += `Source: ${parsedRecipe.sourceUrl}\n`;
    }
    if (parsedRecipe.prepTimeMinutes || parsedRecipe.cookTimeMinutes || parsedRecipe.servings) {
      text += '\n';
      if (parsedRecipe.prepTimeMinutes) text += `Prep: ${parsedRecipe.prepTimeMinutes} min\n`;
      if (parsedRecipe.cookTimeMinutes) text += `Cook: ${parsedRecipe.cookTimeMinutes} min\n`;
      if (parsedRecipe.servings) text += `Servings: ${parsedRecipe.servings}\n`;
    }
    
    // Ingredients
    if (parsedRecipe.ingredients && parsedRecipe.ingredients.length > 0) {
      text += '\n--- INGREDIENTS ---\n\n';
      parsedRecipe.ingredients.forEach((group) => {
        if (group.groupName && group.groupName !== 'Main') {
          text += `${group.groupName}:\n`;
        }
        group.ingredients.forEach((ing) => {
          const parts = [];
          if (ing.amount) parts.push(ing.amount);
          if (ing.units) parts.push(ing.units);
          parts.push(ing.ingredient);
          text += `  ${parts.join(' ')}\n`;
        });
        text += '\n';
      });
    }
    
    // Instructions
    if (parsedRecipe.instructions && parsedRecipe.instructions.length > 0) {
      text += '--- INSTRUCTIONS ---\n\n';
      parsedRecipe.instructions.forEach((instruction, index) => {
        if (typeof instruction === 'string') {
          text += `${index + 1}. ${instruction}\n\n`;
        } else if (typeof instruction === 'object' && instruction !== null) {
          const inst = instruction as any;
          const title = inst.title || `Step ${index + 1}`;
          const detail = inst.detail || inst.text || '';
          text += `${index + 1}. ${title}\n   ${detail}\n\n`;
        }
      });
    }
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRecipe(true);
      setTimeout(() => setCopiedRecipe(false), 2000);
    } catch (err) {
      console.error('Failed to copy recipe:', err);
    }
  };

  const handleMenuAction = (action: string) => {
    switch (action) {
      case 'copy-link':
        handleCopyLink();
        break;
      case 'copy-recipe':
        handleCopyRecipe();
        break;
      case 'edit-mode':
        // Placeholder for edit mode
        alert('Edit mode coming soon!');
        setIsMenuOpen(false);
        break;
      default:
        break;
    }
  };

  // Close settings menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input, textarea, or contenteditable element
      const target = event.target as HTMLElement;
      const isInputElement = 
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.isContentEditable;

      // Copy link shortcut: ⌘L (Mac) or Ctrl+L (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'l') {
        event.preventDefault();
        handleCopyLink();
        return;
      }

      // Toggle between List and Focus views: ⌘J (Mac) or Ctrl+J (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && (event.key === 'j' || event.key === 'J')) {
        event.preventDefault();
        // Toggle: if currently on list view, switch to card (Focus), otherwise switch to list
        setView(view === 'list' ? 'card' : 'list');
        return;
      }

      // Only handle other shortcuts if not typing in an input field
      if (isInputElement) {
        return; // Let the user type normally in input fields
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [view, handleCopyLink]); // Include view and handleCopyLink in dependencies


  // Filter menu items based on search query
  const menuItems = [
    { id: 'copy-link', label: 'Copy link', icon: Link2, shortcut: '⌘L', action: 'copy-link' },
    { id: 'copy-recipe', label: 'Copy recipe', icon: FileText, action: 'copy-recipe' },
    { id: 'edit-mode', label: 'Edit mode', icon: Edit, action: 'edit-mode', disabled: true },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Smart search filtering - show/hide sections based on search query
  const searchLower = searchQuery.toLowerCase();
  const showFontSection = !searchQuery || searchLower.includes('font');
  const showStepSizingSection = !searchQuery || searchLower.includes('step') || searchLower.includes('siz');
  const showMenuActions = !searchQuery || filteredMenuItems.length > 0;

  // Focus search input when menu opens
  useEffect(() => {
    if (isMenuOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isMenuOpen]);

  // Listen for navigation events from outside (e.g., from the Prep tab)
  useEffect(() => {
    const handleSetStep = (event: any) => {
      const { stepNumber } = event.detail;
      if (stepNumber >= 1 && stepNumber <= steps.length) {
        setCurrentStep(stepNumber - 1);
        setView('card');
        
        // Scroll to top of the split view
        const element = document.querySelector('.classic-split-view-container');
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    window.addEventListener('navigate-to-step', handleSetStep);
    return () => window.removeEventListener('navigate-to-step', handleSetStep);
  }, [steps.length]);

  // Safety check: ensure steps is valid
  if (!steps || !Array.isArray(steps) || steps.length === 0) {
    return (
      <div className="flex items-center justify-center h-[600px] md:h-[700px] bg-white rounded-2xl border border-stone-200 p-6">
        <p className="font-albert text-stone-500">No recipe steps available</p>
      </div>
    );
  }

  const handleSelectStep = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStep(index);
      setView('card');

      // Scroll to top of the cook section
      const element = document.querySelector('.classic-split-view-container');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBackToList = () => {
    setView('list');
  };

  return (
    <TooltipProvider delayDuration={400} skipDelayDuration={0}>
      <div className="classic-split-view-container bg-white w-full flex flex-col min-h-[calc(100vh-300px)]">
      {/* Header with View Toggle and Settings - Left aligned */}
      <div className="w-full bg-white sticky top-0 z-20 border-b border-stone-50">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
          {/* View Selection - Left aligned, acts as back button in Focus view */}
          <div className="flex items-center gap-3">
            <div className="flex bg-stone-100/60 p-1 rounded-full">
              {/* List View Button with Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView('list')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors transition-shadow ${
                      view === 'list' 
                        ? 'bg-white text-stone-900 shadow-sm' 
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <List className="w-3.5 h-3.5" />
                    <span className="font-albert text-[11px] font-bold uppercase tracking-wider">List</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Toggle view (⌘J)
                </TooltipContent>
              </Tooltip>
              
              {/* Focus View Button with Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setView('card')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-colors transition-shadow ${
                      view === 'card' 
                        ? 'bg-white text-stone-900 shadow-sm' 
                        : 'text-stone-400 hover:text-stone-600'
                    }`}
                  >
                    <Book className="w-3.5 h-3.5" />
                    <span className="font-albert text-[11px] font-bold uppercase tracking-wider">Focus</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Toggle view (⌘J)
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Settings Menu - Right aligned */}
          <div className="flex items-center gap-3">
            {/* Settings Menu - Using DropdownMenu for consistent behavior */}
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-stone-100 text-stone-900' : 'text-stone-400 hover:bg-stone-50'}`}
                  aria-label="Settings"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-0">
                {/* Search Bar */}
                <div className="p-3 border-b border-stone-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search actions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="menu-search-input w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#0C0A09]/20 focus:border-[#0C0A09]/30 transition-all"
                    />
                  </div>
                </div>

                {/* Font Family Selector */}
                {showFontSection && (
                  <div className="p-3 border-b border-stone-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="menu-section-label text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                        Font
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setFontFamily('sans')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all ${
                          settings.fontFamily === 'sans'
                            ? 'bg-[#0C0A09] text-white border-[#0C0A09]'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className="font-albert text-[16px] font-medium">Ag</span>
                        <span className="menu-action-label text-[12px] font-medium">Default</span>
                      </button>
                      <button
                        onClick={() => setFontFamily('serif')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all ${
                          settings.fontFamily === 'serif'
                            ? 'bg-[#0C0A09] text-white border-[#0C0A09]'
                            : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                        }`}
                      >
                        <span className="font-domine text-[16px] font-medium">Ag</span>
                        <span className="menu-action-label text-[12px] font-medium">Serif</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Menu Actions */}
                {showMenuActions && (
                  <div className="py-1">
                    {filteredMenuItems.length > 0 ? (
                      filteredMenuItems.map((item) => {
                        const Icon = item.icon;
                        const isCopied = (item.id === 'copy-link' && copiedLink) || (item.id === 'copy-recipe' && copiedRecipe);
                        const isDisabled = item.disabled === true;
                        
                        return (
                          <button
                            key={item.id}
                            onClick={() => !isDisabled && handleMenuAction(item.action)}
                            disabled={isDisabled}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors group ${
                              isDisabled 
                                ? 'cursor-not-allowed opacity-50' 
                                : 'hover:bg-stone-50'
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${
                              isCopied 
                                ? 'text-green-600' 
                                : isDisabled 
                                  ? 'text-stone-300' 
                                  : 'text-stone-500 group-hover:text-stone-700'
                            }`} />
                            <span className={`menu-action-label flex-1 text-[14px] ${
                              isCopied 
                                ? 'text-green-600 font-medium' 
                                : isDisabled 
                                  ? 'text-stone-400' 
                                  : 'text-stone-700'
                            }`}>
                              {isCopied ? (item.id === 'copy-link' ? 'Link copied' : 'Recipe copied') : item.label}
                            </span>
                            {item.shortcut && !isDisabled && (
                              <span className="menu-action-label text-[11px] text-stone-400 font-mono">
                                {item.shortcut}
                              </span>
                            )}
                            {isCopied && (
                              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-3 py-6 text-center">
                        <p className="menu-action-label text-[13px] text-stone-400">
                          {searchQuery ? `No results found for "${searchQuery}"` : 'No actions found'}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step Sizing */}
                {showStepSizingSection && (
                  <div className="p-3 border-t border-stone-200">
                    <label className="menu-section-label text-[11px] font-semibold uppercase tracking-wider text-stone-500 block mb-2">
                      Step Sizing
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-stone-50 p-1 rounded-lg border border-stone-200">
                      {(['sm', 'med', 'lg'] as const).map((size) => (
                        <button
                          key={size}
                          onClick={() => setStepSizing(size)}
                          className={`py-1.5 text-[11px] font-bold uppercase rounded-md transition-all font-albert ${
                            settings.stepSizing === size
                              ? 'bg-white text-[#0C0A09] shadow-sm ring-1 ring-stone-200'
                              : 'text-stone-500 hover:text-stone-700'
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show message when search has no matches in any section */}
                {searchQuery && !showFontSection && !showStepSizingSection && !showMenuActions && (
                  <div className="px-3 py-6 text-center">
                    <p className="menu-action-label text-[13px] text-stone-400">
                      No results found for "{searchQuery}"
                    </p>
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        {view === 'list' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 overflow-hidden relative"
          >
            <ListView 
              steps={steps} 
              onSelectStep={handleSelectStep}
              allIngredients={allIngredients}
            />
          </motion.div>
        ) : (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="flex-1 overflow-hidden relative"
          >
            <CardView 
              steps={steps}
              currentStep={currentStep}
              onNext={handleNextStep}
              onPrev={handlePrevStep}
              onBackToList={handleBackToList}
              allIngredients={allIngredients}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </TooltipProvider>
  );
}

