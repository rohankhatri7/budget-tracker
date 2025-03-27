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
import { type ReactNode, useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import CategoryPicker from "./CategoryPicker"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  // Create a separate state for the date picker popover
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const handleCategoryChange = useCallback(
    (value: string) => {
      form.setValue("category", value)
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

      // Invalidate transactions list if you have one
      queryClient.invalidateQueries({
        queryKey: ["transactions"],
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
      toast.loading("Creating transaction...", {
        id: "create-transaction",
      })
      mutate({
        ...values,
        date: DatetoUTCDate(values.date),
      })
    },
    [mutate],
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
                      <CategoryPicker type={type} onChange={handleCategoryChange} />
                    </FormControl>
                    <FormDescription>Select a category for this transaction</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Transaction date</FormLabel>
                    {/* Use the separate datePickerOpen state */}
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[200px] px-3 text-left font-normal",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(value) => {
                            if (!value) return
                            field.onChange(value)
                            setDatePickerOpen(false) // Close the popover after selection
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
            {!isPending && "Create"}
            {isPending && <Loader2 className="animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransactionDialog
