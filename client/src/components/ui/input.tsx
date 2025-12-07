import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * VitaView AI Input Component
 * 
 * Design Language:
 * - Inputs limpos com bordas finas em Light Gray (#E0E0E0)
 * - Estado ativo: Borda Charcoal Gray (#212121)
 * - Estado de erro: Borda em Semantic Red (#D32F2F)
 * - Tipografia: Open Sans Regular
 * - Placeholder: Medium Gray (#9E9E9E)
 */
const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-lightGray bg-pureWhite px-3 py-2 text-base text-charcoal font-body ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-charcoal placeholder:text-mediumGray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:ring-offset-2 focus-visible:border-charcoal disabled:cursor-not-allowed disabled:bg-lightGray disabled:text-mediumGray md:text-sm transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
