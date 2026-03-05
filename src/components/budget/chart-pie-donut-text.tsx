"use client"

import * as React from "react"
import { Label, Pie, PieChart } from "recharts"
import { cn } from "@/lib/utils"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { type ExpenseRow } from "@/lib/ledger-storage"

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
})

function parseCurrency(value: string | null): number {
  if (!value) return 0
  const normalized = value.replace(/[^0-9.-]/g, "")
  const parsed = parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

type ChartPieDonutTextProps = {
  budgetedAmount: number
  rows: ExpenseRow[]
}

export function ChartPieDonutText({ budgetedAmount, rows }: ChartPieDonutTextProps) {
  const totalSpent = React.useMemo(() => {
    return rows.reduce((sum, row) => sum + Math.abs(parseCurrency(row.amount)), 0)
  }, [rows])

  const remaining = Math.max(budgetedAmount - totalSpent, 0)
  const overBudget = totalSpent > budgetedAmount
  const pctUsed = budgetedAmount > 0 ? Math.min((totalSpent / budgetedAmount) * 100, 100) : 0

  const chartData = React.useMemo(() => {
    if (budgetedAmount <= 0 && totalSpent <= 0) {
      return [{ key: "empty", label: "No budget", value: 1, fill: "var(--color-empty)" }]
    }
    if (overBudget) {
      return [
        { key: "spent", label: "Spent", value: budgetedAmount, fill: "var(--color-spent)" },
        { key: "over", label: "Over budget", value: totalSpent - budgetedAmount, fill: "var(--color-over)" },
      ]
    }
    const data = []
    if (totalSpent > 0) {
      data.push({ key: "spent", label: "Spent", value: totalSpent, fill: "var(--color-spent)" })
    }
    if (remaining > 0) {
      data.push({ key: "remaining", label: "Remaining", value: remaining, fill: "var(--color-remaining)" })
    }
    if (data.length === 0) {
      data.push({ key: "empty", label: "No budget", value: 1, fill: "var(--color-empty)" })
    }
    return data
  }, [budgetedAmount, totalSpent, remaining, overBudget])

  const chartConfig: ChartConfig = {
    value: { label: "Amount" },
    spent: { label: "Spent", color: "var(--chart-4)" },
    remaining: { label: "Remaining", color: "var(--chart-1)" },
    over: { label: "Over budget", color: "var(--destructive)" },
    empty: { label: "No data", color: "var(--muted)" },
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1">
        <ChartContainer
          className="mx-auto aspect-square max-h-[220px]"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => {
                    const numVal = typeof value === "number" ? value : parseFloat(String(value))
                    return (
                      <span className="flex items-center gap-2">
                        <span>{String(name)}</span>
                        <span className="font-mono font-medium">{usdFormatter.format(numVal)}</span>
                      </span>
                    )
                  }}
                />
              }
              cursor={false}
            />
            <Pie
              data={chartData}
              dataKey="value"
              innerRadius={55}
              outerRadius={80}
              nameKey="label"
              strokeWidth={2}
              stroke="var(--background)"
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
                          className={cn(
                            "text-2xl font-bold",
                            overBudget ? "fill-destructive" : "fill-foreground",
                          )}
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 6}
                        >
                          {overBudget ? "-" : ""}{usdFormatter.format(overBudget ? totalSpent - budgetedAmount : remaining)}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground text-xs"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 16}
                        >
                          {overBudget ? "over budget" : "remaining"}
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

      {/* Legend */}
      <div className="flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Budgeted</span>
          <span className="text-foreground font-medium tabular-nums font-sans">
            {usdFormatter.format(budgetedAmount)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Spent</span>
          <span className={cn(
            "font-medium tabular-nums font-sans",
            overBudget ? "text-destructive" : "text-foreground",
          )}>
            {usdFormatter.format(totalSpent)}
          </span>
        </div>
        <div className="bg-border my-1 h-px" />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium">
            {overBudget ? "Over" : "Left"}
          </span>
          <span className={cn(
            "font-semibold tabular-nums font-sans",
            overBudget
              ? "text-destructive"
              : remaining < budgetedAmount * 0.1
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-foreground",
          )}>
            {overBudget ? "-" : ""}{usdFormatter.format(overBudget ? totalSpent - budgetedAmount : remaining)}
          </span>
        </div>
        <div className="text-muted-foreground text-xs tabular-nums">
          {Math.round(pctUsed)}% of budget used
        </div>
      </div>
    </div>
  )
}
