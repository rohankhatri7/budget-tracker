"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateTransactionSchema, CreateTransactionSchemaType } from "@/schema/transaction";
import { ReactNode } from "react";

interface Props {
    trigger: ReactNode;
    type: TransactionType;
}

import * as React from "react";
import { useForm } from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormProvider } from "react-hook-form";
import CategoryPicker from "./CategoryPicker";

function CreateTransactionDialog({ trigger, type }: Props) {
    const form = useForm<CreateTransactionSchemaType>({
      resolver: zodResolver(CreateTransactionSchema),
      defaultValues: {
        type,
        date: new Date(),
      },
    });
  
    return (
      <Dialog>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-left">
              Create a new{" "}
              <span
                className={cn(
                  type === "income" ? "text-emerald-600" : "text-rose-600",
                  "font-bold"
                )}
              >
                {type}
              </span>{" "}
              transaction
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input defaultValue={""} {...field} />
                    </FormControl>
                    <FormDescription>
                      Transaction description (optional)
                    </FormDescription>
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
                    <FormDescription>
                      Transaction amount (required)
                    </FormDescription>
                  </FormItem>
                )}
              />
              <div className="flex items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <CategoryPicker type = {type} />
                    </FormControl>
                    <FormDescription>
                      Select category for this transaction (required)
                    </FormDescription>
                  </FormItem>
                )}
              />
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    );
  }
  
  export default CreateTransactionDialog;