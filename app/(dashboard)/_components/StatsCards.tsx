"use client";

import { GetBalanceStateResponseType } from "@/app/api/stats/balance/route";
import SkeletonWrapper from "@/components/SkeletonWrapper";
import { Card } from "@/components/ui/card";
import { DatetoUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import React, { ReactNode, useCallback, useMemo } from "react";
import CountUp from "react-countup"

interface Props {
  from: Date;
  to: Date;
  userSettings: UserSettings;
}

function StatsCards({ from, to, userSettings }: Props) {
  const statsQuery = useQuery<GetBalanceStateResponseType>({
    queryKey: ["overview", "stats", from, to],
    queryFn: () =>
      fetch(
        `/api/stats/balance?from=${DatetoUTCDate(from)}&to=${DatetoUTCDate(to)}`
      ).then((res) => res.json()),
  });

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency)
  }, [userSettings.currency]);

  const income = statsQuery.data?.income || 0;
const expense = statsQuery.data?.expense || 0;

const balance = income - expense;

return (
  <div className="relative flex w-full flex-wrap gap-2 md:flex-nowrap">
    <SkeletonWrapper isLoading={statsQuery.isFetching}>
      <StatCard
        formatter={formatter}
        value={income}
        title="Income"
        icon={
          <TrendingUp className="h-12 w-12 items-center rounded-lg p-2 text-emerald-500 bg-emerald-400/10" />
        }
      />
    </SkeletonWrapper>

    <SkeletonWrapper isLoading={statsQuery.isFetching}>
      <StatCard
        formatter={formatter}
        value={expense}
        title="Expense"
        icon={
          <TrendingDown className="h-12 w-12 items-center rounded-lg p-2 text-rose-500 bg-rose-400/10" />
        }
      />
    </SkeletonWrapper>

    <SkeletonWrapper isLoading={statsQuery.isFetching}>
      <StatCard
        formatter={formatter}
        value={balance}
        title="Balance"
        icon={
          <Wallet className="h-12 w-12 items-center rounded-lg p-2 text-violet-500 bg-violet-400/10" />
        }
      />
    </SkeletonWrapper>
  </div>
);

}

export default StatsCards;

function StatCard({
  formatter,
  value,
  title,
  icon,
}: {
  formatter: Intl.NumberFormat;
  value: number;
  title: string;
  icon: React.ReactNode;
}) {
  const formatFn = useCallback(
    (val: number) => formatter.format(val),
    [formatter]
  );

  return (
    <Card className="flex w-full items-center p-3 h-20 rounded-lg"> {/* Compact size */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="[&>svg]:h-8 [&>svg]:w-8"> {/* Medium icons */}
            {icon}
          </div>
          <p className="text-base font-semibold text-gray-700">{title}</p> {/* Medium text */}
        </div>
        
        <div className="pr-2"> {/* Small right padding */}
          <CountUp
            preserveValue
            redraw={false}
            end={value}
            decimals={2}
            formattingFn={formatFn}
            className={`text-xl font-semibold ${
              title === "Income" 
                ? "text-emerald-600" 
                : title === "Expense" 
                  ? "text-rose-600" 
                  : "text-violet-600"
            }`}
          />
        </div>
      </div>
    </Card>
  );
}