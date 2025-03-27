"use client"

import { DateRangePicker } from "@/components/ui/date-range-picker"
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants"
import type { UserSettings } from "@prisma/client"
import { differenceInDays, startOfMonth } from "date-fns"
import { useState, useCallback } from "react"
import { toast } from "sonner"
import StatsCards from "./StatsCards"

function Overview({ userSettings }: { userSettings: UserSettings }) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

    // Update the date range state
    setDateRange({
      from: values.range.from,
      to: values.range.to,
    })

    // Force a refresh of the stats
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  return (
    <>
      <div className="container flex flex-wrap items-end justify-between gap-2 py-6">
        <h2 className="text-3xl font-bold ml-4">Overview</h2>
        <div className="flex items-center gap-3">
          <DateRangePicker
            initialDateFrom={dateRange.from}
            initialDateTo={dateRange.to}
            showCompare={false}
            onUpdate={handleDateChange}
          />
        </div>
      </div>
      <StatsCards
        key={`stats-${dateRange.from.toISOString()}-${dateRange.to.toISOString()}-${refreshTrigger}`}
        userSettings={userSettings}
        from={dateRange.from}
        to={dateRange.to}
      />
    </>
  )
}

export default Overview
