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

  //fetch category stats to be used in pie chart
  const { data: categoryData } = useQuery<GetCategoriesStatsResponseType>({
    queryKey: ["history", "categories", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/stats/categories?from=${DatetoUTCDate(dateRange.from)}&to=${DatetoUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
  });

  //fetch category stats to be used in bar chart
  const { data: monthlyData } = useQuery<GetMonthlyStatsResponseType>({
    queryKey: ["history", "monthly", dateRange.from, dateRange.to],
    queryFn: () =>
      fetch(
        `/api/stats/monthly?from=${DatetoUTCDate(dateRange.from)}&to=${DatetoUTCDate(dateRange.to)}`
      ).then((res) => res.json()),
  });

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  //set all months to 0 default
  const baseMonthlyData = useMemo(() => monthNames.map(month => ({
    month,
    income: 0,
    expense: 0
  })), [monthNames]);

  const formattedMonthlyData = useMemo(() => {
    if (!monthlyData) return [];

    return baseMonthlyData.map(baseMonth => {
      const monthIndex = monthNames.indexOf(baseMonth.month);
      
      
      const startOfCurrentMonth = new Date(dateRange.from.getFullYear(), monthIndex, 1);
      const endOfCurrentMonth = new Date(dateRange.from.getFullYear(), monthIndex + 1, 0);
      
      //create dates for the selected range
      const startOfRange = new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), 1);
      const endOfRange = new Date(dateRange.to.getFullYear(), dateRange.to.getMonth() + 1, 0);

      //show month if month is in range
      const isInRange = (
        startOfCurrentMonth.getTime() >= startOfRange.getTime() &&
        endOfCurrentMonth.getTime() <= endOfRange.getTime()
      );

      if (!isInRange) return null;

      const monthData = monthlyData.find(data => {
        const [monthStr] = data.month.split('/');
        return parseInt(monthStr) - 1 === monthIndex;
      });

      return {
        month: baseMonth.month,
        income: monthData?.income || 0,
        expense: monthData?.expense || 0
      };
    }).filter(Boolean);
  }, [monthlyData, dateRange, monthNames]);

  //filter category data based on date range
  const filteredCategoryData = useMemo(() => {
    if (!categoryData) return [];
    
    return categoryData;
  }, [categoryData]);

  //split pie chart by data type
  const incomeData = filteredCategoryData.filter((d) => d.type === "income") || [];
  const expenseData = filteredCategoryData.filter((d) => d.type === "expense") || [];

  const COLORS = [
    '#0088FE', //blue
    '#00C49F', //green
    '#FFBB28', //yellow
    '#FF8042', //orange
    '#8884d8', //purple
    '#82ca9d', //light Green
    '#ffc658', //light Orange
    '#8dd1e1', //light Blue
    '#a4de6c', //lime
    '#d0ed57'  //yellow Green
  ];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const total = payload[0].payload.type === "income" 
        ? incomeData.reduce((acc, curr) => acc + (curr._sum?.amount || 0), 0)
        : expenseData.reduce((acc, curr) => acc + (curr._sum?.amount || 0), 0);
      
      //only show percentage if total is greater than 0
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : "0.0";
      
      return (
        <div className="bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatter.format(value)}</p>
          <p className="text-xs text-muted-foreground">
            ({percentage}%)
          </p>
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
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incomeData}
                  dataKey="_sum.amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {incomeData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => {
                    const amount = entry.payload._sum.amount;
                    const total = incomeData.reduce((acc, curr) => acc + curr._sum.amount, 0);
                    const percentage = ((amount / total) * 100).toFixed(1);
                    return (
                      <span className="text-sm">
                        {value} ({percentage}%)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expense Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Expense Distribution</h3>
          <div className="h-[300px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  dataKey="_sum.amount"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                >
                  {expenseData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  formatter={(value, entry: any) => {
                    const amount = entry.payload._sum.amount;
                    const total = expenseData.reduce((acc, curr) => acc + curr._sum.amount, 0);
                    const percentage = ((amount / total) * 100).toFixed(1);
                    return (
                      <span className="text-sm">
                        {value} ({percentage}%)
                      </span>
                    );
                  }}
                />
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
                  cursor={{ fill: 'rgba(255,255,255,0.1)' }}
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