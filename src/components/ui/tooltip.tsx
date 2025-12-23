"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

import { cn } from "@/lib/utils"

const TooltipContext = React.createContext<{
  isAnyTooltipOpen: boolean
  registerTooltip: () => void
  unregisterTooltip: () => void
}>({
  isAnyTooltipOpen: false,
  registerTooltip: () => {},
  unregisterTooltip: () => {},
})

export function TooltipGroupProvider({
  children,
  delayDuration = 500,
}: {
  children: React.ReactNode
  delayDuration?: number
}) {
  const [openTooltipCount, setOpenTooltipCount] = React.useState(0)
  const isAnyTooltipOpen = openTooltipCount > 0

  const registerTooltip = React.useCallback(() => {
    setOpenTooltipCount((prev) => prev + 1)
  }, [])

  const unregisterTooltip = React.useCallback(() => {
    setOpenTooltipCount((prev) => Math.max(0, prev - 1))
  }, [])

  const dynamicDelayDuration = isAnyTooltipOpen ? 0 : delayDuration

  return (
    <TooltipContext.Provider
      value={{
        isAnyTooltipOpen,
        registerTooltip,
        unregisterTooltip,
      }}
    >
      <TooltipPrimitive.Provider
        data-slot="tooltip-provider"
        delayDuration={dynamicDelayDuration}
      >
        {children}
      </TooltipPrimitive.Provider>
    </TooltipContext.Provider>
  )
}

export function TooltipProvider({
  delayDuration = 500,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  )
}

export function Tooltip({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  const { registerTooltip, unregisterTooltip } = React.useContext(TooltipContext)

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        registerTooltip()
      } else {
        unregisterTooltip()
      }
      if (onOpenChange) {
        onOpenChange(open)
      }
    },
    [registerTooltip, unregisterTooltip, onOpenChange]
  )

  return (
    <TooltipPrimitive.Root
      data-slot="tooltip"
      {...props}
      onOpenChange={handleOpenChange}
    />
  )
}

export function TooltipTrigger({
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

export function TooltipContent({
  className,
  sideOffset = 0,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  const { isAnyTooltipOpen } = React.useContext(TooltipContext)

  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "bg-foreground text-background z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
          isAnyTooltipOpen
            ? ""
            : "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          className
        )}
        {...props}
      >
        {children}
        <TooltipPrimitive.Arrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]" />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  )
}
