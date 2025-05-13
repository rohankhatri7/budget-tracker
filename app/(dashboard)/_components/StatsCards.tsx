"use client"

import type { GetBalanceStateResponseType } from "@/app/api/stats/balance/route"
import SkeletonWrapper from "@/components/SkeletonWrapper"
import { Card } from "@/components/ui/card"
import { DatetoUTCDate, GetFormatterForCurrency } from "@/lib/helpers"
import type { UserSettings } from "@prisma/client"
import { useQuery } from "@tanstack/react-query"
import { TrendingUp, TrendingDown, Wallet } from "lucide-react"
import type React from "react"
import { useCallback, useMemo, useState, useRef, useEffect, MouseEvent } from "react"
import CountUp from "react-countup"

interface Props {
  from: Date
  to: Date
  userSettings: UserSettings
}
//fetch total income, expense and balance for the date range
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
    staleTime: 0,
    refetchOnWindowFocus: true,
    retry: 1,
    refetchInterval: 0,
  })

  if (error) {
    return <div className="text-red-500 text-center p-4">Error: {error.message}</div>
  }

  const income = data?.income || 0
  const expense = data?.expense || 0
  const balance = income - expense

  //render the 3 cards
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-6 mb-4">
      <SkeletonWrapper isLoading={isLoading}>
        <StatCard
          formatter={formatter}
          value={income}
          title="Income"
          icon={<TrendingUp className="h-12 w-12 text-emerald-600" />}
        />
      </SkeletonWrapper>

      <SkeletonWrapper isLoading={isLoading}>
        <StatCard
          formatter={formatter}
          value={expense}
          title="Expense"
          icon={<TrendingDown className="h-12 w-12 text-rose-600" />}
        />
      </SkeletonWrapper>

      <SkeletonWrapper isLoading={isLoading}>
        <StatCard
          formatter={formatter}
          value={balance}
          title="Balance"
          icon={<Wallet className="h-12 w-12 text-violet-600" />}
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
  const cardRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  // tilting effect
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    //further from center = more rotation
    const rotateY = ((x - centerX) / centerX) * 10
    const rotateX = ((centerY - y) / centerY) * 10
    
    setRotation({ x: rotateX, y: rotateY })
  }

  //reset rotation when mouse leaves
  const handleMouseLeave = () => {
    setIsHovering(false)
    setRotation({ x: 0, y: 0 })
  }
  //set hovering state when mouse enters
  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  return (
    <div 
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="w-full perspective-1000 h-28"
    >
      <Card 
        className={`
          flex w-full items-center p-4 h-28 rounded-lg 
          transition-transform duration-200 ease-out 
          transform-gpu will-change-transform 
          shadow-lg hover:shadow-xl
          ${isHovering ? 'bg-gradient-to-br from-background to-background/90' : ''}
        `}
        style={{ 
          transform: isHovering ? 
            `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.03, 1.03, 1.03)` : 
            'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
        }}
      >
        <div className="flex w-full items-center justify-between relative">
          <div 
            className="flex items-center gap-4 transition-transform duration-200"
            style={{ 
              transform: isHovering ? 
                `translateZ(15px)` : 
                'translateZ(0px)'
            }}
          >
            <div className="[&>svg]:h-12 [&>svg]:w-12">{icon}</div>
            <p className="text-2xl font-semibold text-white">{title}</p>
          </div>
          <div 
            className="pr-3 transition-transform duration-200"
            style={{ 
              transform: isHovering ? 
                `translateZ(25px)` : 
                'translateZ(0px)'
            }}
          >
            <CountUp
              preserveValue
              redraw={false}
              end={value}
              decimals={2}
              formattingFn={formatFn}
              className={`text-3xl font-semibold ${
                title === "Income" ? "text-emerald-600" : title === "Expense" ? "text-rose-600" : "text-violet-600"
              }`}
            />
          </div>
        </div>
      </Card>
    </div>
  )
}
