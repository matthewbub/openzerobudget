import { InlineTooltip } from "@/components/ui/inline-tooltip"

type BudgetBreadcrumbTitleProps = {
  category: string | null
  month: string | null
  payPeriod: string | null
  year: string | null
  fallbackId: string
}

function BudgetBreadcrumbTitle({
  category,
  month,
  payPeriod,
  year,
  fallbackId,
}: BudgetBreadcrumbTitleProps) {
  const categoryText = category?.trim() || `Budget #${fallbackId}`
  const monthText = month?.trim() || "-"
  const payPeriodText = payPeriod?.trim() || "-"
  const yearText = year?.trim() || "-"

  return (
    <span>
      <InlineTooltip tooltip="Category">
        {categoryText}
      </InlineTooltip>{" "}
      - (
      <InlineTooltip tooltip="Month">
        {monthText}
      </InlineTooltip>{" "}
      <InlineTooltip tooltip="Pay Period">
        {payPeriodText}
      </InlineTooltip>{" "}
      <InlineTooltip tooltip="Year">
        {yearText}
      </InlineTooltip>
      )
    </span>
  )
}

export { BudgetBreadcrumbTitle }
