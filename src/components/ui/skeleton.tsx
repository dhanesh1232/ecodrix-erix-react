import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("erix-animate-pulse erix-rounded-md erix-bg-accent", className)}
      {...props}
    />
  )
}

export { Skeleton }
