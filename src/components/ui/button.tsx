import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-albert font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#0072FF]/50 focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: 'bg-[#0072FF] text-white shadow-sm hover:bg-[#0072FF]/90',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-600/90',
        outline:
          'border border-[#d9d9d9] bg-white text-[#1e1e1e] hover:bg-gray-50',
        secondary:
          'bg-[#f5f5f5] text-[#1e1e1e] shadow-sm hover:bg-[#f5f5f5]/80',
        ghost: 'hover:bg-gray-100 text-[#1e1e1e]',
        link: 'text-[#0072FF] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-12 rounded-lg px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
