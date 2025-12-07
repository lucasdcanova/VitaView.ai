import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/**
 * VitaView AI Button Component
 * 
 * Design Language:
 * - Primary: Fundo Charcoal Gray (#212121), Texto White (#FFFFFF), cantos arredondados
 * - Secondary: Borda e Texto Charcoal Gray (#212121), Fundo transparente, cantos arredondados
 * - Disabled: Fundo Medium Gray (#9E9E9E), Texto Light Gray (#E0E0E0)
 * - Tipografia: Montserrat Bold
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-bold font-heading ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 disabled:pointer-events-none disabled:bg-mediumGray disabled:text-lightGray [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-charcoal text-pureWhite hover:bg-[#424242]",
        destructive: "bg-[#D32F2F] text-pureWhite hover:bg-[#B71C1C]",
        outline: "border border-charcoal bg-transparent text-charcoal hover:bg-lightGray",
        secondary: "bg-lightGray text-charcoal hover:bg-[#BDBDBD]",
        ghost: "hover:bg-lightGray text-charcoal",
        link: "text-charcoal underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
