"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useDateRange } from "@/lib/hooks/useDateRange";
import { UserSettings, Transaction, Category } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { DatetoUTCDate, GetFormatterForCurrency, preserveDateWithoutTimezone } from "@/lib/helpers";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { useCallback, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/lib/types";

interface Props {
  userSettings: UserSettings;
}

type TransactionFilterType = "all" | "income" | "expense";

interface CategoryOption {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
}

function TransactionsClient({ userSettings }: Props) {
  const { dateRange, setDateRange } = useDateRange();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<TransactionFilterType>("all");

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  const handleDateChange = useCallback((values: { range: { from: Date; to: Date | undefined } }) => {
    if (!values.range.from || !values.range.to) {
      toast.error("Please select both start and end dates");
      return;
    }

    const daysDifference = differenceInDays(values.range.to, values.range.from);
    if (daysDifference > MAX_DATE_RANGE_DAYS) {
      toast.error(`Maximum date range is ${MAX_DATE_RANGE_DAYS} days`);
      return;
    }

    if (daysDifference < 0) {
      toast.error("End date cannot be before start date");
      return;
    }

    setDateRange({
      from: values.range.from,
      to: values.range.to,
    });
  }, [setDateRange]);

  // Fetch categories for the filter
  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  // Fetch transactions with filters
  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", dateRange.from, dateRange.to, selectedCategory, selectedType],
    queryFn: async () => {
      const params = new URLSearchParams({
        from: DatetoUTCDate(dateRange.from).toISOString(),
        to: DatetoUTCDate(dateRange.to).toISOString(),
      });

      if (selectedCategory && selectedCategory !== "all") {
        // Extract the category name from the composite ID (name-type)
        const selectedCategoryName = selectedCategory.split('-')[0];
        params.append("category", selectedCategoryName);
        
        // If type is not already filtered, also filter by the category's type
        if (selectedType === "all") {
          const categoryType = selectedCategory.split('-')[1] as TransactionType;
          if (categoryType) {
            params.append("type", categoryType);
          }
        }
      }

      if (selectedType && selectedType !== "all") {
        params.append("type", selectedType);
      }

      console.log("Fetching transactions with params:", {
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        fromUTC: DatetoUTCDate(dateRange.from).toISOString(),
        toUTC: DatetoUTCDate(dateRange.to).toISOString(),
        category: selectedCategory,
        extractedCategory: selectedCategory !== "all" ? selectedCategory.split('-')[0] : null,
        type: selectedType
      });

      const response = await fetch(`/api/transactions?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch transactions");
      }
      const data = await response.json();
      console.log("Received transactions:", data);
      return data;
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    return categories.map((cat) => ({
      id: `${cat.name}-${cat.type}`,
      name: cat.name,
      type: cat.type,
      icon: cat.icon
    }));
  }, [categories]);

  const filteredCategories = useMemo(() => {
    if (selectedType === "all") return categoryOptions;
    return categoryOptions.filter(cat => cat.type === selectedType);
  }, [categoryOptions, selectedType]);

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-end justify-between">
        <div className="flex flex-col md:flex-row gap-4">
          <Select
            defaultValue="all"
            value={selectedType}
            onValueChange={(value: TransactionFilterType) => {
              setSelectedType(value);
              setSelectedCategory("all"); // Reset category when type changes
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type">
                {selectedType === "all" ? "All types" : selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>

          <Select
            defaultValue="all"
            value={selectedCategory}
            onValueChange={(value: string) => setSelectedCategory(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category">
                {selectedCategory === "all" ? "All categories" : categories?.find(cat => `${cat.name}-${cat.type}` === selectedCategory)?.name || selectedCategory}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {filteredCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name} ({category.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DateRangePicker
          initialDateFrom={dateRange.from}
          initialDateTo={dateRange.to}
          showCompare={false}
          onUpdate={handleDateChange}
        />
      </div>

      <Card>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : transactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                transactions?.map((transaction) => {
                  const category = categories?.find(
                    (cat) => cat.name === transaction.category && cat.type === transaction.type
                  );
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">
                        {category?.icon} {transaction.category}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell>
                        {(() => {
                          const originalDate = new Date(transaction.date);
                          const preservedDate = preserveDateWithoutTimezone(transaction.date);
                          console.log(`Transaction date transformation:`, {
                            id: transaction.id,
                            original: originalDate.toISOString(),
                            preserved: preservedDate.toISOString(),
                            displayed: format(preservedDate, "MM/dd/yyyy")
                          });
                          return format(preservedDate, "MM/dd/yyyy");
                        })()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                            transaction.type === "income"
                              ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                              : "bg-rose-500/10 text-rose-500 ring-rose-500/20"
                          }`}
                        >
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            transaction.type === "income" ? "text-emerald-500" : "text-rose-500"
                          }
                        >
                          {formatter.format(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

export default TransactionsClient; 