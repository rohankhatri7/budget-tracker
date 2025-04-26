"use client"

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { TransactionType } from "@/lib/types"
import { cn } from "@/lib/utils"
import { CreateTransactionSchema, type CreateTransactionSchemaType } from "@/schema/transaction"
import { type ReactNode, useState, useCallback, useRef, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import CategoryPicker from "./CategoryPicker"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { CreateTransaction } from "../_actions/transactions"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { DatetoUTCDate } from "@/lib/helpers"

interface Props {
  trigger: ReactNode
  type: TransactionType
}

function CreateTransactionDialog({ trigger, type }: Props) {
  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type,
      date: new Date(),
    },
  })

  const [open, setOpen] = useState(false)
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null);
  const dateCalendarRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      // If both refs are defined and neither contains the target, close the date picker
      if (
        datePickerOpen &&
        dateInputRef.current &&
        dateCalendarRef.current &&
        !dateInputRef.current.contains(event.target as Node) &&
        !dateCalendarRef.current.contains(event.target as Node)
      ) {
        setDatePickerOpen(false);
      }
    }

    // Attach event listener
    document.addEventListener('mousedown', handleOutsideClick);
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [datePickerOpen]);

  const handleCategoryChange = useCallback(
    (value: string) => {
      console.log("Category changed to:", value)
      form.setValue("category", value)
      // Trigger validation after setting the value
      form.trigger("category")
    },
    [form],
  )

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: CreateTransaction,
    onSuccess: () => {
      toast.success("Transaction created successfully 🎉", {
        id: "create-transaction",
      })

      form.reset({
        type,
        description: "",
        amount: 0,
        date: new Date(),
        category: undefined,
      })

      // Invalidate all relevant queries to ensure UI updates
      queryClient.invalidateQueries({
        queryKey: ["overview"],
      })

      // Also invalidate the stats queries
      queryClient.invalidateQueries({
        queryKey: ["overview-stats"],
      })

      // Invalidate transactions list
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
      })

      // Invalidate analytics queries
      queryClient.invalidateQueries({
        queryKey: ["history", "categories"],
      })
      queryClient.invalidateQueries({
        queryKey: ["history", "monthly"],
      })

      setOpen(false)
    },
    onError: (error) => {
      toast.error(`Error creating transaction: ${error.message}`, {
        id: "create-transaction",
      })
    },
  })

  const onSubmit = useCallback(
    (values: CreateTransactionSchemaType) => {
      console.log("Form submission values:", values)
      
      // Additional validation check
      if (!values.category) {
        console.error("Missing category in form submission")
        form.setError("category", {
          type: "manual",
          message: "Please select a category"
        })
        toast.error("Please select a category", {
          id: "create-transaction",
        })
        return
      }
      
      toast.loading("Creating transaction...", {
        id: "create-transaction",
      })
      mutate({
        ...values,
        date: DatetoUTCDate(values.date),
      })
    },
    [mutate, form],
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-left">
            Create a new{" "}
            <span className={cn(type === "income" ? "text-emerald-600" : "text-rose-600", "font-bold")}>{type}</span>{" "}
            transaction
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input defaultValue={""} {...field} />
                  </FormControl>
                  <FormDescription>Transaction description (optional)</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input defaultValue={0} type="number" {...field} />
                  </FormControl>
                  <FormDescription>Transaction amount (required)</FormDescription>
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategoryPicker 
                        type={type} 
                        onChange={handleCategoryChange} 
                      />
                    </FormControl>
                    <FormDescription>Select a category for this transaction</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction date</FormLabel>
                    <div className="relative">
                      <input
                        ref={dateInputRef}
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        readOnly
                        value={field.value ? format(field.value, "PPP") : "Select a date"}
                        onClick={() => setDatePickerOpen(!datePickerOpen)}
                      />
                      <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-50 pointer-events-none" />
                      
                      {datePickerOpen && (
                        <div 
                          ref={dateCalendarRef}
                          className="absolute top-[42px] left-0 z-[1000] bg-background border rounded-md shadow-md p-3"
                          onClick={(e) => e.stopPropagation()}
                          style={{ width: '300px' }}
                        >
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                              if (date) {
                                field.onChange(date);
                                form.setValue('date', date);
                                setTimeout(() => {
                                  setDatePickerOpen(false);
                                }, 100);
                              }
                            }}
                            fromYear={2020}
                            toYear={2030}
                          />
                        </div>
                      )}
                    </div>
                    <FormDescription>Select a date for this transaction</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant={"secondary"}
              onClick={() => {
                form.reset({
                  type,
                  description: "",
                  amount: 0,
                  date: new Date(),
                  category: undefined,
                })
              }}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={() => {
              form.trigger().then(isValid => {
                console.log("Form validation result:", isValid, "Errors:", form.formState.errors);
                
                // Check if category is selected
                const categoryValue = form.getValues("category");
                if (!categoryValue) {
                  form.setError("category", { 
                    type: "required", 
                    message: "Category is required" 
                  });
                  toast.error("Please select a category");
                  return;
                }
                
                if (isValid) {
                  // Directly submit if valid
                  const values = form.getValues();
                  onSubmit(values);
                } else {
                  // Focus on the first error field
                  const firstError = Object.keys(form.formState.errors)[0] as keyof CreateTransactionSchemaType;
                  if (firstError) {
                    form.setFocus(firstError);
                  }
                  
                  // Show toast with the error
                  const errorMessage = Object.values(form.formState.errors)[0]?.message || "Please fix form errors";
                  toast.error(errorMessage);
                }
              });
            }} 
            disabled={isPending}
          >
            {!isPending && "Create"}
            {isPending && <Loader2 className="animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransactionDialog
