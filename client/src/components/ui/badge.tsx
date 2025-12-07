import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * VitaView AI Badge Component
 * 
 * Design Language:
 * - Default: Charcoal Gray (#212121) com texto branco
 * - Secondary: Light Gray (#E0E0E0) com texto Charcoal Gray
 * - Destructive: Alert Red (#D32F2F)
 * - Outline: Borda Charcoal Gray
 * - Tipografia: Montserrat Bold
 */
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-heading font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-charcoal focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-charcoal text-pureWhite hover:bg-[#424242]",
        secondary:
          "border-transparent bg-lightGray text-charcoal hover:bg-[#BDBDBD]",
        destructive:
          "border-transparent bg-[#D32F2F] text-pureWhite hover:bg-[#B71C1C]",
        outline:
          "border-charcoal text-charcoal bg-transparent",
        success:
          "border-transparent bg-[#424242] text-pureWhite",
        muted:
          "border-transparent bg-mediumGray text-pureWhite",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
