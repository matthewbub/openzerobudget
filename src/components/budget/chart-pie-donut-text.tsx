"use client"

import * as React from "react"
import { RiArrowUpLine } from "@remixicon/react"
import { Label, Pie, PieChart } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { type ExpenseRow } from "@/lib/ledger-storage"

type ChartPieDonutTextProps = {
  rows: ExpenseRow[]
}

export function ChartPieDonutText({ rows }: ChartPieDonutTextProps) {
  const statusData = React.useMemo(() => {
    const buckets = new Map<string, number>()

    for (const row of rows) {
      const label = row.status.trim() || "Unlabeled"
      buckets.set(label, (buckets.get(label) ?? 0) + 1)
    }

    const source = buckets.size
      ? Array.from(buckets.entries())
      : [["No expenses", 1] as const]

    return source.map(([label, value], index) => {
      const key = `status${index + 1}`
      return {
        key,
        label,
        value,
        fill: `var(--color-${key})`,
      }
    })
  }, [rows])

  const chartConfig = React.useMemo(() => {
    return statusData.reduce<ChartConfig>(
      (config, entry, index) => {
        config[entry.key] = {
          label: entry.label,
          color: `var(--chart-${(index % 5) + 1})`,
        }
        return config
      },
      {
        value: { label: "Expenses" },
      }
    )
  }, [statusData])

  const totalExpenses = rows.length

  return (
    <div className="bg-muted/20 flex h-full flex-col rounded-xl p-4">
      <div className="mb-3 text-center">
        <h3 className="text-sm font-semibold">Expense Status</h3>
        <p className="text-muted-foreground text-xs">Distribution for this budget row</p>
      </div>
      <div className="flex-1">
        <ChartContainer
          className="mx-auto aspect-square max-h-[250px]"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
            />
            <Pie
              data={statusData}
              dataKey="value"
              innerRadius={60}
              nameKey="label"
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        <tspan
                          className="fill-foreground text-3xl font-bold"
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          {totalExpenses.toLocaleString()}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                        >
                          Expenses
                        </tspan>
                      </text>
                    )
                  }

                  return null
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>
      <div className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <RiArrowUpLine className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing status mix for logged expenses
        </div>
      </div>
    </div>
  )
}
