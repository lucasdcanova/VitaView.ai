import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * VitaView AI Textarea Component
 * 
 * Design Language:
 * - Bordas Light Gray (#E0E0E0)
 * - Focus: Borda Charcoal Gray (#212121)
 * - Placeholder: Medium Gray (#9E9E9E)
 * - Tipografia: Open Sans Regular
 */
export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> { }

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border border-lightGray bg-pureWhite px-3 py-2 text-sm text-charcoal font-body placeholder:text-mediumGray focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal focus-visible:border-charcoal disabled:cursor-not-allowed disabled:bg-lightGray disabled:text-mediumGray transition-all duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }