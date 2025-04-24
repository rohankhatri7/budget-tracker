"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card } from "@/components/ui/card";
import { DatetoUTCDate, GetFormatterForCurrency } from "@/lib/helpers";
import { UserSettings } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { useCallback, useMemo } from "react";
import { toast } from "sonner";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { BarChart, PieChart, Cell, Bar, XAxis, YAxis, Tooltip, Legend, Pie, ResponsiveContainer } from "recharts";
import type { GetCategoriesStatsResponseType } from "@/app/api/stats/categories/route";
import type { GetMonthlyStatsResponseType } from "@/app/api/stats/monthly/route";
import { useDateRange } from "@/lib/hooks/useDateRange";

interface Props {
  userSettings: UserSettings;
}

function HistoryClient({ userSettings }: Props) {
  const { dateRange, setDateRange } = useDateRange();

  const handleDateChange = useCallback((values: { range: { from: Date; to: Date | undefined } }) => {
    if (!values.range.from || !values.range.to) {
      toast.error("Please select both start and end dates");
      return;
    }

    const daysDifference = differenceInDays(values.range.to, values.range.from);
    if (daysDifference < 0) {
      toast.error("End date cannot be before start date");
      return;
    }

    setDateRange({
      from: values.range.from,
      to: values.range.to,
    });
  }, [setDateRange]);

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const { data: categoryData } = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["history", "categories", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?from=${DatetoUTCDate(dateRange.from)}&to=${DatetoUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
  });

  const { data: monthlyData } = useQuery<GetMonthlyStatsResponseType>({
    queryKey: ["history", "monthly", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/stats/monthly?from=${DatetoUTCDate(dateRange.from)}&to=${DatetoUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
  });

  const incomeData = categoryData?.filter((d) => d.type === "income") || [];
  const expenseData = categoryData?.filter((d) => d.type === "expense") || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="text-sm text-white">
          <p className="font-medium">{payload[0].name}</p>
          <p>{formatter.format(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <p className="font-medium text-white">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatter.format(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Create base data with all months initialized to 0
  const baseMonthlyData = monthNames.map(month => ({
    month,
    income: 0,
    expense: 0
  }));

  // Merge actual data with base data
  const formattedMonthlyData = baseMonthlyData.map(baseMonth => {
    const monthData = monthlyData?.find(data => {
      const [month] = data.month.split('/');
      return monthNames[parseInt(month) - 1] === baseMonth.month;
    });

    return monthData ? {
      month: baseMonth.month,
      income: monthData.income,
      expense: monthData.expense
    } : baseMonth;
  });

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      <div className="flex justify-end">
        <DateRangePicker
          initialDateFrom={dateRange.from}
          initialDateTo={dateRange.to}
          showCompare={false}
          onUpdate={handleDateChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Income Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  dataKey="_sum.amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.category} (${((entry._sum.amount / incomeData.reduce((acc: number, curr: any) => acc + (curr._sum?.amount || 0), 0)) * 100).toFixed(1)}%)`}
                >
                  {incomeData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomPieTooltip />}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Expense Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="_sum.amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry: any) => `${entry.category} (${((entry._sum.amount / expenseData.reduce((acc: number, curr: any) => acc + (curr._sum?.amount || 0), 0)) * 100).toFixed(1)}%)`}
                >
                  {expenseData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  content={<CustomPieTooltip />}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Monthly Trends */}
        <Card className="p-6 md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Monthly Income vs Expense</h3>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={formattedMonthlyData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 20
                }}
              >
                <XAxis 
                  dataKey="month" 
                  angle={0}
                  tick={{ fill: 'white' }}
                />
                <YAxis 
                  tickFormatter={(value) => formatter.format(value)}
                  width={100}
                  tick={{ fill: 'white' }}
                />
                <Tooltip 
                  content={<CustomBarTooltip />}
                  cursor={{ fill: 'transparent' }}
                />
                <Legend 
                  wrapperStyle={{ color: 'white' }}
                />
                <Bar 
                  dataKey="income" 
                  name="Income" 
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="expense" 
                  name="Expense" 
                  fill="#ef4444"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default HistoryClient; 