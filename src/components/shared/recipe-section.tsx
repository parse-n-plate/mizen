"use client";

import type { ReactNode, Ref } from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RecipeSectionProps {
  title: string;
  children: ReactNode;
  count?: number;
  summary?: ReactNode;
  headerAction?: ReactNode;
  notice?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerRef?: Ref<HTMLButtonElement>;
}

// The same disclosure and spacing used by ingredient groups.
export function RecipeSection({
  title,
  children,
  count,
  summary,
  headerAction,
  notice,
  open,
  defaultOpen = true,
  onOpenChange,
  triggerRef,
}: RecipeSectionProps) {
  return (
    <AccordionPrimitive.Root
      type="single"
      collapsible
      value={open === undefined ? undefined : open ? "section" : ""}
      defaultValue={defaultOpen ? "section" : undefined}
      onValueChange={(value) => onOpenChange?.(value === "section")}
      className="ingredient-group mb-6 font-sans"
    >
      <AccordionPrimitive.Item value="section" className="ingredient-group-accordion">
        <div className="flex items-center gap-2">
          <AccordionPrimitive.Header className="min-w-0 flex-1">
            <AccordionPrimitive.Trigger asChild>
              <Button
                ref={triggerRef}
                type="button"
                variant="ghost"
                className="ingredient-group-trigger group h-auto w-full min-w-0 flex-1 flex-col items-start justify-start gap-0 rounded-lg py-2.5 px-0 active:!transform-none md:px-3"
              >
                <span className="flex min-w-0 w-full items-center gap-3">
                  <span className="font-sans text-base font-semibold text-foreground">{title}</span>
                  {count !== undefined && (
                    <span
                      className="font-sans text-sm font-normal text-muted-foreground"
                      aria-label={`${count} prep items`}
                    >
                      {count}
                    </span>
                  )}
                  <ChevronDown className="ingredient-group-chevron size-4 text-muted-foreground" />
                </span>
                {summary && (
                  <span className="mt-1 flex items-start gap-1.5 whitespace-normal text-left font-sans text-sm font-normal text-muted-foreground">
                    {summary}
                  </span>
                )}
              </Button>
            </AccordionPrimitive.Trigger>
          </AccordionPrimitive.Header>
          {headerAction}
        </div>
        {notice}
        <AccordionPrimitive.Content className="ingredient-group-content overflow-hidden">
          <div className="ingredient-group-content-inner">{children}</div>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    </AccordionPrimitive.Root>
  );
}
