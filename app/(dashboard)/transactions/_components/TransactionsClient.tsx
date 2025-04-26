"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useDateRange } from "@/lib/hooks/useDateRange";
import { UserSettings, Transaction, Category } from "@prisma/client";
import { useQuery } from "@tanstack/react-query";
import { DatetoUTCDate, GetFormatterForCurrency, preserveDateWithoutTimezone } from "@/lib/helpers";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { useCallback, useMemo, useState, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChevronDown, ChevronUp, MoreHorizontal, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TransactionType } from "@/lib/types";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { DeleteTransaction } from "../../_actions/transactions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Props {
  userSettings: UserSettings;
}

type TransactionFilterType = "all" | "income" | "expense";
type SortField = "date" | "amount" | null;
type SortDirection = "asc" | "desc";

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
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const queryClient = useQueryClient();

  // Keep a copy of the original transactions to restore if needed
  const originalTransactionsRef = useRef<Transaction[] | null>(null);
  
  // Track the transaction being deleted
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState<string | null>(null);

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency);
  }, [userSettings.currency]);

  // Simple function to handle opening the delete dialog
  const handleDeleteTransaction = useCallback((transaction: Transaction) => {
    // Store the transaction ID separately to avoid reference issues
    setCurrentTransactionId(transaction.id);
    setTransactionToDelete(transaction);
  }, []);

  // Completely separated delete function
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      setIsDeleting(true);
      
      // Show loading toast
      toast.loading("Deleting transaction...", { id: "delete-transaction" });
      
      // Call the server action
      await DeleteTransaction(id);
      
      // Show success toast
      toast.success("Transaction deleted successfully", { id: "delete-transaction" });
      
      // Invalidate queries in sequence to avoid overwhelming the UI
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      await queryClient.invalidateQueries({ queryKey: ["overview"] });
      await queryClient.invalidateQueries({ queryKey: ["overview-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["history", "categories"] });
      await queryClient.invalidateQueries({ queryKey: ["history", "monthly"] });
      
    } catch (error) {
      console.error("Delete transaction error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete transaction", { 
        id: "delete-transaction" 
      });
    } finally {
      // Clean up regardless of outcome
      setIsDeleting(false);
      setTransactionToDelete(null);
      setCurrentTransactionId(null);
    }
  }, [queryClient]);

  // Clean confirmation handler
  const confirmDelete = useCallback(() => {
    const id = currentTransactionId;
    if (!id) return;
    
    // Close the dialog first
    setTransactionToDelete(null);
    
    // Then perform the deletion
    deleteTransaction(id);
  }, [currentTransactionId, deleteTransaction]);

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

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Set new field and default to descending (newest/highest first)
      setSortField(field);
      setSortDirection("desc");
    }
  }, [sortField, setSortDirection]);

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

  const sortedTransactions = useMemo(() => {
    if (!transactions) return [];
    if (!sortField) return transactions;
    
    try {
      return [...transactions].sort((a, b) => {
        if (sortField === "date") {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        } else if (sortField === "amount") {
          return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
        }
        return 0;
      });
    } catch (error) {
      console.error("Error sorting transactions:", error);
      return transactions; // Fall back to unsorted if there's an error
    }
  }, [transactions, sortField, sortDirection]);

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
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="border-b">
                <TableHead className="border-r p-3 bg-muted/30 font-medium">Category</TableHead>
                <TableHead className="border-r p-3 bg-muted/30 font-medium">Description</TableHead>
                <TableHead 
                  onClick={() => handleSort("date")}
                  className="border-r p-3 bg-muted/30 font-medium cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    Date
                    {sortField === "date" && (
                      sortDirection === "asc" ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="border-r p-3 bg-muted/30 font-medium">Type</TableHead>
                <TableHead 
                  onClick={() => handleSort("amount")}
                  className="border-r p-3 bg-muted/30 font-medium text-right cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-end">
                    Amount
                    {sortField === "amount" && (
                      sortDirection === "asc" ? 
                        <ChevronUp className="h-4 w-4 ml-1" /> : 
                        <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="p-3 bg-muted/30 font-medium w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading transactions...
                  </TableCell>
                </TableRow>
              ) : sortedTransactions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No transactions found
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions?.map((transaction) => {
                  const category = categories?.find(
                    (cat) => cat.name === transaction.category && cat.type === transaction.type
                  );
                  return (
                    <TableRow key={transaction.id} className="border-b hover:bg-muted/10">
                      <TableCell className="border-r font-medium">
                        {category?.icon} {transaction.category}
                      </TableCell>
                      <TableCell className="border-r">{transaction.description}</TableCell>
                      <TableCell className="border-r">
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
                      <TableCell className="border-r">
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
                      <TableCell className="border-r text-right">
                        <span
                          className={
                            transaction.type === "income" ? "text-emerald-500" : "text-rose-500"
                          }
                        >
                          {formatter.format(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive flex items-center"
                              onClick={() => handleDeleteTransaction(transaction)}
                            >
                              <Trash className="h-4 w-4 mr-2" />
                              Delete Transaction
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={!!transactionToDelete} 
        onOpenChange={(open: boolean) => {
          if (!open && !isDeleting) {
            setTransactionToDelete(null);
            setCurrentTransactionId(null);
          }
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this transaction?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the{' '}
              {transactionToDelete?.type} transaction{' '}
              {transactionToDelete?.description && `"${transactionToDelete.description}"`} of{' '}
              {transactionToDelete?.amount && formatter.format(transactionToDelete.amount)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                confirmDelete();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default TransactionsClient; 