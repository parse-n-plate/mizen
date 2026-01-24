"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

// Simple context to track if any tooltip is open (for data-instant attribute)
const TooltipContext = React.createContext<{
  isAnyTooltipOpen: boolean
  setAnyTooltipOpen: (open: boolean) => void
}>({
  isAnyTooltipOpen: false,
  setAnyTooltipOpen: () => {},
})

export function TooltipProvider({
  delayDuration = 400,
  skipDelayDuration = 0,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  const [isAnyTooltipOpen, setIsAnyTooltipOpen] = React.useState(false)

  return (
    <TooltipContext.Provider value={{ isAnyTooltipOpen, setAnyTooltipOpen: setIsAnyTooltipOpen }}>
      <TooltipPrimitive.Provider
        delayDuration={delayDuration}
        skipDelayDuration={skipDelayDuration}
        {...props}
      />
    </TooltipContext.Provider>
  )
}

export function Tooltip({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const { setAnyTooltipOpen } = React.useContext(TooltipContext)

  return (
    <TooltipPrimitive.Root
      onOpenChange={(open) => {
        setAnyTooltipOpen(open)
        onOpenChange?.(open)
      }}
      {...props}
    />
  )
}

export function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger {...props} />
}

export function TooltipContent({
  className,
  sideOffset = 5,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const { isAnyTooltipOpen } = React.useContext(TooltipContext)

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-instant={isAnyTooltipOpen ? true : undefined}
        sideOffset={sideOffset}
        className={cn(
          "tooltip bg-stone-900 text-white z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance font-albert shadow-lg border border-stone-700",
          className
        )}
        style={{
          transformOrigin: 'var(--radix-tooltip-content-transform-origin)',
        }}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
