"use client"

import { DateRangePicker } from "@/components/ui/date-range-picker"
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants"
import type { UserSettings } from "@prisma/client"
import { differenceInDays } from "date-fns"
import { useCallback } from "react"
import { toast } from "sonner"
import StatsCards from "./StatsCards"
import CategoriesStats from "./CategoriesStats"
import { useDateRange } from "@/lib/hooks/useDateRange"

function Overview({ userSettings }: { userSettings: UserSettings }) {
  const { dateRange, setDateRange } = useDateRange();

  const handleDateChange = useCallback((values: { range: { from: Date; to: Date | undefined } }) => {
    if (!values.range.from || !values.range.to) {
      toast.error("Please select both start and end dates")
      return
    }

    const daysDifference = differenceInDays(values.range.to, values.range.from)
    if (daysDifference > MAX_DATE_RANGE_DAYS) {
      toast.error(`Maximum date range is ${MAX_DATE_RANGE_DAYS} days`)
      return
    }

    if (daysDifference < 0) {
      toast.error("End date cannot be before start date")
      return
    }

    setDateRange({
      from: values.range.from,
      to: values.range.to,
    })
  }, [setDateRange])

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-2 py-6 px-4">
        <h2 className="text-3xl font-bold">Overview</h2>
        <div className="flex items-center gap-3 pr-8">
          <DateRangePicker
            initialDateFrom={dateRange.from}
            initialDateTo={dateRange.to}
            showCompare={false}
            onUpdate={handleDateChange}
          />
        </div>
      </div>
      <StatsCards
        userSettings={userSettings}
        from={dateRange.from}
        to={dateRange.to}
      />

      <CategoriesStats
        userSettings={userSettings}
        from={dateRange.from}
        to={dateRange.to}
      />
    </>
  )
}

export default Overview
