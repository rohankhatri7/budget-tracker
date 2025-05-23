"use client";

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserSettings, Category } from "@prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TrendingDown, TrendingUp, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import data from "@emoji-mart/data";

const Picker = dynamic(() => import("@emoji-mart/react"), {
  ssr: false,
  loading: () => <p>Loading...</p>
});

interface Props {
  userSettings: UserSettings;
}

const currencies = [
  { label: "$ US Dollar", value: "USD" },
  { label: "€ Euro", value: "EUR" },
  { label: "£ Pound", value: "GBP" },
  { label: "¥ Yen", value: "JPY" },
];

function ManageClient({ userSettings }: Props) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [categoryType, setCategoryType] = useState<"income" | "expense">("income");
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const theme = useTheme();

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => fetch("/api/categories").then((res) => res.json()),
  });

  const handleCurrencyChange = async (currency: string) => {
    try {
      const response = await fetch("/api/settings/currency", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency }),
      });

      if (!response.ok) throw new Error("Failed to update currency");

      toast.success("Currency updated successfully");
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    } catch (error) {
      toast.error("Failed to update currency");
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName || !newCategoryIcon) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCategoryName,
          icon: newCategoryIcon,
          type: categoryType,
        }),
      });

      if (!response.ok) throw new Error("Failed to create category");

      toast.success("Category created successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["overview", "stats", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["overview-stats"] });
      setIsCreateDialogOpen(false);
      setNewCategoryName("");
      setNewCategoryIcon("");
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    try {
      const categoryId = `${category.name}|${category.type}`;
      const response = await fetch(`/api/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete category");

      toast.success("Category deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["overview", "stats", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["overview-stats"] });
      setIsDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const incomeCategories = categories?.filter((cat: any) => cat.type === "income") || [];
  const expenseCategories = categories?.filter((cat: any) => cat.type === "expense") || [];

  const CategoryCard = ({ category }: { category: Category }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-center text-center">
          <span className="flex items-center gap-2">
            {category.icon} {category.name}
            {categories && categories.filter((c: Category) => c.name === category.name).length > 1 && (
              <span className="text-xs text-muted-foreground">
                ({category.type})
              </span>
            )}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Dialog 
          open={isDeleteDialogOpen && categoryToDelete?.name === category.name && categoryToDelete?.type === category.type} 
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setCategoryToDelete(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="w-full text-muted-foreground hover:text-destructive hover:bg-red-500/10 dark:hover:bg-red-500 dark:hover:text-white"
              onClick={() => setCategoryToDelete(category)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Category</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the category "{category.name}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex items-center gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  setCategoryToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDeleteCategory(category)}
              >
                Delete Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-7xl mx-auto py-6 space-y-8">
      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Set your default currency for transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue={userSettings.currency} onValueChange={handleCurrencyChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.value} value={currency.value}>
                  {currency.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Income Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Income categories
            </CardTitle>
            <CardDescription>Sorted by name</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen && categoryType === "income"} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            setCategoryType("income");
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white dark:bg-white dark:text-black dark:hover:bg-white/90">Create category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Income Category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon (emoji)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="icon"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      placeholder="Category icon (emoji)"
                      className="w-full"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" type="button">
                          Pick Emoji
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pick an Emoji</DialogTitle>
                        </DialogHeader>
                        <div className="h-[400px] overflow-y-auto">
                          <Picker
                            data={data}
                            theme={theme.resolvedTheme}
                            onEmojiSelect={(emoji: { native: string }) => {
                              setNewCategoryIcon(emoji.native);
                              setIsCreateDialogOpen(true);
                            }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateCategory}>Create category</Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {incomeCategories.map((category) => (
              <CategoryCard 
                key={`${category.name}-${category.type}`} 
                category={category} 
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Expense Categories */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-rose-500" />
              Expense categories
            </CardTitle>
            <CardDescription>Sorted by name</CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen && categoryType === "expense"} onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            setCategoryType("expense");
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-white dark:bg-white dark:text-black dark:hover:bg-white/90">Create category</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Expense Category</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Category name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="icon">Icon (emoji)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="icon"
                      value={newCategoryIcon}
                      onChange={(e) => setNewCategoryIcon(e.target.value)}
                      placeholder="Category icon (emoji)"
                      className="w-full"
                    />
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" type="button">
                          Pick Emoji
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Pick an Emoji</DialogTitle>
                        </DialogHeader>
                        <div className="h-[400px] overflow-y-auto">
                          <Picker
                            data={data}
                            theme={theme.resolvedTheme}
                            onEmojiSelect={(emoji: { native: string }) => {
                              setNewCategoryIcon(emoji.native);
                              setIsCreateDialogOpen(true);
                            }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
              <Button onClick={handleCreateCategory}>Create category</Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {expenseCategories.map((category) => (
              <CategoryCard 
                key={`${category.name}-${category.type}`} 
                category={category} 
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ManageClient; 