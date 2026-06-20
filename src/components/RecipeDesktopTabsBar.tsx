"use client";

import type { ParsedRecipe } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Flag from "@solar-icons/react/csr/ui/Flag";
import Ruler from "@solar-icons/react/csr/tools/Ruler";

export type RecipeTabValue = "prep" | "cook";
export type RecipeUnitSystem = "original" | "metric" | "imperial";

interface RecipeDesktopTabsBarProps {
  recipe: ParsedRecipe;
  activeTab: RecipeTabValue;
  onTabChange: (tab: RecipeTabValue) => void;
  isConverted: boolean;
  recipeUnitSystem: "metric" | "imperial";
  unitSystem: RecipeUnitSystem;
  onUnitSystemChange: (unitSystem: RecipeUnitSystem) => void;
  copied: boolean;
  onCopyRecipe: () => void;
  onShare: () => void;
  onPrint?: () => void;
  onDelete?: (event: Event) => void;
  onEdit?: () => void;
  onReport?: () => void;
  showReport?: boolean;
}

export function RecipeDesktopTabsBar({
  recipe,
  activeTab,
  onTabChange,
  isConverted,
  recipeUnitSystem,
  unitSystem,
  onUnitSystemChange,
  copied,
  onCopyRecipe,
  onShare,
  onPrint,
  onDelete,
  onEdit,
  onReport,
  showReport = false,
}: RecipeDesktopTabsBarProps) {
  return (
    <div className="group/tabs hidden w-full items-end gap-0 md:flex">
      <button
        onClick={() => onTabChange("prep")}
        className={`folder-tab-trigger press-scale h-12 px-10 font-sans text-[15px] ${
          activeTab === "prep" ? "font-semibold" : "font-medium"
        }`}
        data-state={activeTab === "prep" ? "active" : "inactive"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/icon-prep.png"
          alt=""
          width={24}
          height={24}
          className="tab-icon-prep h-6 w-6"
        />
        Prep
        {recipe.prepTimeMinutes ? (
          <span className="ml-1.5 font-normal text-stone-400 dark:text-stone-500">
            {formatTime(recipe.prepTimeMinutes)}
          </span>
        ) : null}
      </button>
      <button
        onClick={() => onTabChange("cook")}
        className={`folder-tab-trigger press-scale h-12 px-10 font-sans text-[15px] ${
          activeTab === "cook" ? "font-semibold" : "font-medium"
        }`}
        data-state={activeTab === "cook" ? "active" : "inactive"}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/assets/icon-cook.svg"
          alt=""
          width={24}
          height={24}
          className="tab-icon-cook h-6 w-6"
        />
        Cook
        {recipe.cookTimeMinutes ? (
          <span className="ml-1.5 font-normal text-stone-400 dark:text-stone-500">
            {formatTime(recipe.cookTimeMinutes)}
          </span>
        ) : null}
      </button>

      <div className="ml-auto flex items-center gap-1 pb-2">
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Convert units"
                  className={`press-scale inline-flex h-8 w-8 items-center justify-center rounded-lg transition ${
                    isConverted
                      ? "border border-[var(--color-blue)]/15 bg-[var(--color-blue-light)] text-[var(--color-blue)]"
                      : "text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300"
                  }`}
                >
                  <Ruler size={16} weight={isConverted ? "Bold" : undefined} />
                </button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Convert units</TooltipContent>
          </Tooltip>
          <DropdownMenuContent
            align="end"
            className="w-[244px] rounded-lg border-stone-200 bg-white p-1.5 shadow-[0_10px_24px_rgba(44,42,37,0.12)] dark:border-stone-700 dark:bg-stone-900"
          >
            <DropdownMenuRadioGroup
              value={unitSystem}
              onValueChange={(value) => onUnitSystemChange(value as RecipeUnitSystem)}
            >
              <DropdownMenuRadioItem
                value="original"
                className="h-[38px] text-stone-700 dark:text-stone-300"
              >
                <span className="min-w-0 flex-1 truncate">
                  Original ({recipeUnitSystem === "metric" ? "Metric" : "Imperial"})
                </span>
                <span className="shrink-0 text-xs font-normal text-stone-500 dark:text-stone-400">
                  source
                </span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="metric"
                className="h-9 text-stone-700 dark:text-stone-300"
              >
                <span className="min-w-0 flex-1 truncate">Metric</span>
                <span className="shrink-0 text-xs font-normal text-stone-500 dark:text-stone-400">
                  g / ml
                </span>
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem
                value="imperial"
                className="h-9 text-stone-700 dark:text-stone-300"
              >
                <span className="min-w-0 flex-1 truncate">Imperial</span>
                <span className="shrink-0 text-xs font-normal text-stone-500 dark:text-stone-400">
                  oz / cup
                </span>
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onCopyRecipe}
              aria-label="Copy recipe"
              className="press-scale inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
              </svg>
            </button>
          </TooltipTrigger>
          <TooltipContent>{copied ? "Copied!" : "Copy recipe"}</TooltipContent>
        </Tooltip>

        {showReport && onReport && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={onReport}
                aria-label="Report recipe"
                className="press-scale inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300"
              >
                <Flag size={16} aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent>Report recipe</TooltipContent>
          </Tooltip>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="More actions"
              className="press-scale inline-flex h-8 w-8 items-center justify-center rounded-lg text-stone-400 transition hover:bg-stone-100 hover:text-stone-600 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-300"
            >
              <svg
                className="h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <circle cx="5" cy="12" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="19" cy="12" r="1.5" />
              </svg>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900"
          >
            {onEdit && (
              <DropdownMenuItem
                onSelect={onEdit}
                className="text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-300 dark:focus:bg-stone-800 dark:focus:text-stone-50"
              >
                Edit
                <svg
                  className="ml-auto h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              onSelect={() => (onPrint ? onPrint() : window.print())}
              className="text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-300 dark:focus:bg-stone-800 dark:focus:text-stone-50"
            >
              Print
              <svg
                className="ml-auto h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect width="12" height="8" x="6" y="14" />
              </svg>
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={onShare}
              className="text-stone-700 focus:bg-stone-100 focus:text-stone-900 dark:text-stone-300 dark:focus:bg-stone-800 dark:focus:text-stone-50"
            >
              Share
              <svg
                className="ml-auto h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" x2="12" y1="2" y2="15" />
              </svg>
            </DropdownMenuItem>
            {onDelete && (
              <>
                <DropdownMenuSeparator className="bg-stone-200 dark:bg-stone-700" />
                <DropdownMenuItem
                  onSelect={onDelete}
                  className="text-stone-700 focus:bg-stone-100 focus:text-red-600 dark:text-stone-300 dark:focus:bg-stone-800 dark:focus:text-red-400"
                >
                  Delete
                  <svg
                    className="ml-auto h-4 w-4 text-red-500 dark:text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    <line x1="10" x2="10" y1="11" y2="17" />
                    <line x1="14" x2="14" y1="11" y2="17" />
                  </svg>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
