"use client"

import * as React from "react"
import * as HoverCardPrimitive from "@radix-ui/react-hover-card"

import { cn } from "@/lib/utils"

// ── Group context ──────────────────────────────────────────────────────────
// When cards live inside a HoverCardGroup, only one can be open at a time.
// Transitioning between cards is instant (no delay, no animation).
interface HoverCardGroupContextValue {
  activeId: string | null
  wasTransition: boolean
  requestOpen: (id: string) => void
  requestClose: (id: string) => void
}

const HoverCardGroupContext =
  React.createContext<HoverCardGroupContextValue | null>(null)

function HoverCardGroup({ children }: { children: React.ReactNode }) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [wasTransition, setWasTransition] = React.useState(false)
  const activeIdRef = React.useRef<string | null>(null)

  // Keep ref in sync so callbacks always see the latest value.
  activeIdRef.current = activeId

  const requestOpen = React.useCallback((id: string) => {
    const prev = activeIdRef.current
    setWasTransition(prev !== null && prev !== id)
    setActiveId(id)
  }, [])

  const requestClose = React.useCallback((id: string) => {
    // Only honour the close if this card is still the active one.
    if (activeIdRef.current !== id) return
    setActiveId(null)
    setWasTransition(false)
  }, [])

  const value = React.useMemo(
    () => ({ activeId, wasTransition, requestOpen, requestClose }),
    [activeId, wasTransition, requestOpen, requestClose],
  )

  return (
    <HoverCardGroupContext.Provider value={value}>
      {children}
    </HoverCardGroupContext.Provider>
  )
}

// ── HoverCard ──────────────────────────────────────────────────────────────

function HoverCard({
  openDelay = 400,
  closeDelay = 200,
  onOpenChange,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>) {
  const group = React.useContext(HoverCardGroupContext)
  const id = React.useId()

  // Inside a group → controlled (only one card open at a time).
  // Outside a group → uncontrolled (standard Radix behaviour).
  const isInGroup = group !== null
  const open = isInGroup ? group.activeId === id : undefined
  const effectiveDelay = isInGroup && group.activeId !== null ? 0 : openDelay

  return (
    <HoverCardPrimitive.Root
      open={open}
      openDelay={effectiveDelay}
      closeDelay={closeDelay}
      onOpenChange={(next) => {
        if (isInGroup) {
          if (next) group.requestOpen(id)
          else group.requestClose(id)
        }
        onOpenChange?.(next)
      }}
      {...props}
    />
  )
}

// ── HoverCardTrigger ───────────────────────────────────────────────────────

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>) {
  return <HoverCardPrimitive.Trigger {...props} />
}

// ── HoverCardContent ───────────────────────────────────────────────────────

function HoverCardContent({
  className,
  align = "center",
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>) {
  const group = React.useContext(HoverCardGroupContext)
  const wasTransition = group?.wasTransition ?? false

  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        sideOffset={sideOffset}
        // Skip enter AND exit animations when moving between cards.
        data-instant={wasTransition ? "" : undefined}
        className={cn(
          "hover-card-content",
          "z-50 w-72 rounded-lg border border-stone-200 bg-white shadow-lg outline-hidden",
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent, HoverCardGroup }
