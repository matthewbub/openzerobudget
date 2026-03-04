"use client"

import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    color?: string
  }
}

type ChartContextProps = {
  config: ChartConfig
}

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }
  return context
}

function ChartContainer({
  id,
  className,
  children,
  config,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"]
}) {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  const colorVars = Object.fromEntries(
    Object.entries(config)
      .filter(([, value]) => Boolean(value.color))
      .map(([key, value]) => [`--color-${key}`, value.color])
  ) as React.CSSProperties

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn("h-[250px] w-full", className)}
        style={{ ...colorVars, ...style }}
        {...props}
      >
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  )
}

const ChartTooltip = RechartsPrimitive.Tooltip

type TooltipPayloadItem = {
  color?: string
  name?: string
  value?: string | number
  dataKey?: string | number
  payload?: {
    label?: string
  }
}

function ChartTooltipContent({
  active,
  payload,
  className,
  hideLabel = false,
}: React.ComponentProps<"div"> & {
  active?: boolean
  payload?: TooltipPayloadItem[]
  hideLabel?: boolean
}) {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      className={cn(
        "bg-background grid min-w-[9rem] gap-1 rounded-lg border px-3 py-2 text-xs shadow-lg",
        className
      )}
    >
      {payload.map((item, index) => {
        const itemKey = String(item.dataKey ?? item.name ?? "")
        const resolvedLabel =
          item.payload?.label || config[itemKey]?.label || item.name || itemKey

        return (
          <div className="flex items-center justify-between gap-2" key={`${itemKey}-${index}`}>
            {!hideLabel && <span className="text-muted-foreground">{resolvedLabel}</span>}
            <span
              className="font-medium tabular-nums"
              style={{ color: item.color }}
            >
              {item.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}

export { ChartContainer, ChartTooltip, ChartTooltipContent }
