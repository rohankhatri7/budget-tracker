"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TransactionType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CreateCategorySchema, CreateCategorySchemaType } from "@/schema/categories";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleOff, Loader2, PlusSquare, X } from "lucide-react";
import React, { useCallback, useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CreateCategory } from "../_actions/categories";
import { Category } from "@prisma/client";
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface Props {
  type: TransactionType;
  successCallback: (category: Category) => void;
  className?: string;
}

function CreateCategoryDialog({ type, successCallback, className }: Props) {
  const [open, setOpen] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiContainerRef = useRef<HTMLDivElement>(null);
  
  const form = useForm<CreateCategorySchemaType>({
    resolver: zodResolver(CreateCategorySchema),
    defaultValues: {
      type,
    },
  });

  const queryClient = useQueryClient();
  const theme = useTheme();

  // Close emoji picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        emojiContainerRef.current && 
        !emojiContainerRef.current.contains(event.target as Node) &&
        showEmojiPicker
      ) {
        // Only close the emoji picker, not the dialog
        setShowEmojiPicker(false);
      }
    }

    // Add event listener only when emoji picker is open
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  const { mutate, isPending } = useMutation({
    mutationFn: CreateCategory,
    onSuccess: async (data: Category) => {
      form.reset({
        name: "",
        icon: "",
        type,
      });
      
      toast.success(`Category ${data.name} created successfully 🎉`, {
        id: "create-category",
      });

      successCallback(data);

      await queryClient.invalidateQueries({
        queryKey: ["categories"],
      });
      
      setOpen(false);
    },
    onError: () => {
      toast.error("Something went wrong", {
        id: "create-category",
      });
    },
  });

  const onSubmit = useCallback(
    (values: CreateCategorySchemaType) => {
      toast.loading("Creating category...", {
        id: "create-category",
      });
      mutate(values);
    },
    [mutate]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={"ghost"}
          className={cn(
            "flex border-separate items-center justify-start rounded-none border-b px-3 py-3 text-muted-foreground",
            className
          )}
        >
          <PlusSquare className="mr-2 h-4 w-4" />
          Create new
        </Button>
      </DialogTrigger>
      <DialogContent 
        onClick={(e) => e.stopPropagation()} 
        onPointerDownCapture={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
        className="overflow-visible"
      >
        <DialogHeader>
          <DialogTitle>
            Create{" "}
            <span
              className={cn(
                type === "income" ? "text-emerald-500" : "text-rose-500"
              )}
            >
              {type}
            </span>{" "}
            category
          </DialogTitle>
          <DialogDescription>
            Categories are used to group your transactions
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Category" {...field} />
                  </FormControl>
                  <FormDescription>
                    This is how your category will appear in the app
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Button 
                        type="button"
                        variant="outline" 
                        className="h-[100px] w-full"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowEmojiPicker(!showEmojiPicker);
                        }}
                      >
                        {field.value ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-5xl" role="img">
                              {field.value}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Click to change
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2">
                            <CircleOff className="h-[48px] w-[48px]" />
                            <p className="text-xs text-muted-foreground">
                              Click to select
                            </p>
                          </div>
                        )}
                      </Button>

                      {showEmojiPicker && (
                        <div 
                          ref={emojiContainerRef}
                          className="absolute top-[110px] left-0 z-[1000] w-full max-w-[350px] border border-border rounded-md bg-background shadow-lg"
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <div className="flex justify-between items-center p-2 border-b">
                            <span className="font-medium">Select emoji</span>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setShowEmojiPicker(false)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="p-2">
                            <Picker
                              theme={theme.resolvedTheme}
                              data={data}
                              onEmojiSelect={(emoji: { native: string }) => {
                                field.onChange(emoji.native);
                                setShowEmojiPicker(false);
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    This is how your category will appear in the application
                  </FormDescription>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant={"secondary"}
              onClick={() => {
                form.reset();
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
  );
}

export default CreateCategoryDialog;