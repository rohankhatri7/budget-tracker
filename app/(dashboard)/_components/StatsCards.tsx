"use client"

import type { GetBalanceStateResponseType } from "@/app/api/stats/balance/route"
import SkeletonWrapper from "@/components/SkeletonWrapper"
import { Card } from "@/components/ui/card"
import { DatetoUTCDate, GetFormatterForCurrency } from "@/lib/helpers"
import type { UserSettings } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import type React from "react"
import { useCallback, useMemo } from "react"
import CountUp from "react-countup"

interface Props {
  from: Date
  to: Date
  userSettings: UserSettings
}

function StatsCards({ from, to, userSettings }: Props) {
  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency)
  }, [userSettings.currency])

  const { data, isLoading, error } = useQuery<GetBalanceStateResponseType>({
    queryKey: ["overview-stats", from.toISOString(), to.toISOString(), userSettings.currency],
    queryFn: async () => {
      const fromUTC = DatetoUTCDate(from)
      const toUTC = DatetoUTCDate(to)

      const response = await fetch(`/api/stats/balance?from=${fromUTC.toISOString()}&to=${toUTC.toISOString()}`)

      if (!response.ok) {
        throw new Error("Failed to fetch statistics")
      }

      return response.json()
    },
    staleTime: 0, // Don't cache the data
    refetchOnWindowFocus: true,
    retry: 1,
  })

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error.message}</div>
  }

  const income = data?.income || 0
  const expense = data?.expense || 0
  const balance = income - expense

  return (
    <div className="relative flex w-full flex-wrap gap-2 md:flex-nowrap px-6">
      <SkeletonWrapper isLoading={isLoading}>
        <StatCard
          formatter={formatter}
          value={income}
          title="Income"
          icon={<TrendingUp className="h-8 w-8 text-emerald-600" />}
        />
      </SkeletonWrapper>

      <SkeletonWrapper isLoading={isLoading}>
        <StatCard
          formatter={formatter}
          value={expense}
          title="Expense"
          icon={<TrendingDown className="h-8 w-8 text-rose-600" />}
        />
      </SkeletonWrapper>

      <SkeletonWrapper isLoading={isLoading}>
        <StatCard
          formatter={formatter}
          value={balance}
          title="Balance"
          icon={<Wallet className="h-8 w-8 text-violet-600" />}
        />
      </SkeletonWrapper>
    </div>
  )
}

export default StatsCards

const StatCard = ({
  formatter,
  value,
  title,
  icon,
}: {
  formatter: Intl.NumberFormat
  value: number
  title: string
  icon: React.ReactNode
}) => {
  const formatFn = useCallback((val: number) => formatter.format(val), [formatter])

  return (
    <Card className="flex w-full items-center p-3 h-20 rounded-lg">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="[&>svg]:h-8 [&>svg]:w-8">{icon}</div>
          <p className="text-base font-semibold text-gray-700">{title}</p>
        </div>
        <div className="pr-2">
          <CountUp
            preserveValue
            redraw={false}
            end={value}
            decimals={2}
            formattingFn={formatFn}
            className={`text-xl font-semibold ${
              title === "Income" ? "text-emerald-600" : title === "Expense" ? "text-rose-600" : "text-violet-600"
            }`}
          />
        </div>
      </div>
    </Card>
  )
}

