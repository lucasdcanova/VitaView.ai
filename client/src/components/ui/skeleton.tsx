import { cn } from "@/lib/utils"

/**
 * VitaView AI Skeleton Component
 * 
 * Design Language:
 * - Cor: Light Gray (#E0E0E0)
 * - Animação pulse sutil
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-lg bg-[#E0E0E0]", className)}
      {...props}
    />
  )
}

export { Skeleton }
