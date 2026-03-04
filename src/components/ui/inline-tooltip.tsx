import * as React from "react"

import { cn } from "@/lib/utils"

type InlineTooltipProps = React.ComponentProps<"span"> & {
  tooltip: string
}

function InlineTooltip({
  className,
  tooltip,
  children,
  ...props
}: InlineTooltipProps) {
  return (
    <span
      className={cn(
        "underline-offset-2 hover:decoration-dotted hover:underline",
        className
      )}
      title={tooltip}
      {...props}
    >
      {children}
    </span>
  )
}

export { InlineTooltip }
