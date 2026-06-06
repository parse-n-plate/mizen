"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { toast } from "sonner";
import ChefHat from "@solar-icons/react/csr/food/ChefHat";
import SolarSearch from "@solar-icons/react/csr/search/Magnifier";
import Ruler from "@solar-icons/react/csr/tools/Ruler";
import SolarCopy from "@solar-icons/react/csr/ui/Copy";
import Flag from "@solar-icons/react/csr/ui/Flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

type RecipeTabValue = "prep" | "cook";

function IconTile({ name, usage, children }: { name: string; usage: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100">
        {children}
      </div>
      <div>
        <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{name}</p>
        <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">{usage}</p>
      </div>
    </div>
  );
}

function RecipeNote() {
  return (
    <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
      <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Crisp Tomato Toast</p>
      <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
        Imported from mizen.recipes with 6 ingredients and 4 steps.
      </p>
    </div>
  );
}

export function DialogDesignSystemExample() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Open dialog</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report an issue</DialogTitle>
          <DialogDescription>
            Use dialogs when the user needs to complete a focused desktop task.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <RecipeNote />
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Wrong ingredient</Badge>
            <Badge variant="outline">Missing step</Badge>
            <Badge variant="outline">Import issue</Badge>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button>Submit report</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DrawerDesignSystemExample() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button size="sm">Open drawer</Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Adjust units</DrawerTitle>
          <DrawerDescription>
            Use drawers for mobile-first bottom-sheet tasks that stay close to the current recipe.
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-3 px-4">
          <RecipeNote />
          <div className="grid gap-2">
            <Button variant="outline" className="justify-between">
              US customary
              <span className="text-xs text-stone-400 dark:text-stone-500">Selected</span>
            </Button>
            <Button variant="outline" className="justify-between">
              Metric
              <span className="text-xs text-stone-400 dark:text-stone-500">Preview</span>
            </Button>
          </div>
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button>Apply units</Button>
          </DrawerClose>
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export function ToastDesignSystemExample() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => toast.success("Recipe saved")}>
        Success toast
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => toast.warning("Some ingredients may need review")}
      >
        Warning toast
      </Button>
      <Button size="sm" variant="outline" onClick={() => toast.error("Failed to parse recipe")}>
        Error toast
      </Button>
    </div>
  );
}

export function IconographyDesignSystemExample() {
  return (
    <div className="space-y-3">
      <IconTile name="Ruler" usage="Unit conversion and measurement controls.">
        <Ruler size={18} />
      </IconTile>
      <IconTile name="Flag" usage="Reporting, review, and issue escalation.">
        <Flag size={18} />
      </IconTile>
      <IconTile name="ChefHat" usage="Cooking, recipe, and product component groups.">
        <ChefHat size={18} />
      </IconTile>
      <IconTile name="Magnifier" usage="Search and filter entry points.">
        <SolarSearch size={18} />
      </IconTile>
      <IconTile name="Copy" usage="Copy recipe, copy link, and docs copy actions.">
        <SolarCopy size={18} />
      </IconTile>
    </div>
  );
}

export function CustomIconographyDesignSystemExample() {
  return (
    <div className="space-y-3">
      <IconTile name="Prep tab" usage="Custom bitmap used in desktop recipe tabs.">
        <Image
          src="/assets/icon-prep.png"
          alt=""
          width={24}
          height={24}
          className="tab-icon-prep h-6 w-6"
        />
      </IconTile>
      <IconTile name="Cook tab" usage="Custom SVG used in desktop recipe tabs.">
        <Image
          src="/assets/icon-cook.svg"
          alt=""
          width={24}
          height={24}
          className="tab-icon-cook h-6 w-6"
        />
      </IconTile>
    </div>
  );
}

export function RecipeTabsDesignSystemExample() {
  const [activeTab, setActiveTab] = useState<RecipeTabValue>("prep");

  return (
    <div className="flex flex-col">
      <div className="group/tabs flex w-full items-end gap-0">
        <button
          type="button"
          onClick={() => setActiveTab("prep")}
          className={`folder-tab-trigger press-scale h-12 px-10 font-sans text-[15px] ${
            activeTab === "prep" ? "font-semibold" : "font-medium"
          }`}
          data-state={activeTab === "prep" ? "active" : "inactive"}
        >
          <Image
            src="/assets/icon-prep.png"
            alt=""
            width={24}
            height={24}
            className="tab-icon-prep h-6 w-6"
          />
          Prep
          <span className="ml-1.5 font-normal text-stone-400 dark:text-stone-500">12 min</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cook")}
          className={`folder-tab-trigger press-scale h-12 px-10 font-sans text-[15px] ${
            activeTab === "cook" ? "font-semibold" : "font-medium"
          }`}
          data-state={activeTab === "cook" ? "active" : "inactive"}
        >
          <Image
            src="/assets/icon-cook.svg"
            alt=""
            width={24}
            height={24}
            className="tab-icon-cook h-6 w-6"
          />
          Cook
          <span className="ml-1.5 font-normal text-stone-400 dark:text-stone-500">18 min</span>
        </button>
      </div>

      <div
        className={`border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 ${
          activeTab === "prep" ? "rounded-b-lg rounded-tr-lg" : "rounded-b-lg rounded-t-lg"
        }`}
      >
        {activeTab === "prep" ? (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Prep view</p>
            <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
              Gather bread, tomatoes, garlic, olive oil, and basil before cooking.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-950">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-100">Cook view</p>
            <p className="mt-1 text-sm leading-6 text-stone-500 dark:text-stone-400">
              Toast the bread, rub with garlic, spoon tomatoes over top, and finish with basil.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
