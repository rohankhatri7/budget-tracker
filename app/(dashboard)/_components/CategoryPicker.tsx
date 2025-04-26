import type { TransactionType } from "@/lib/types"
import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateCategoryDialog from "./CreateCategoryDialog"
import { toast } from "sonner"

interface CategoryPickerProps {
  type: TransactionType
  onChange: (value: string) => void
}

function CategoryPicker({ type, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [newCategory, setNewCategory] = useState<any>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  console.log("CategoryPicker rendering with type:", type)

  // Handle clicks outside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const { data: categories, isLoading, error } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      console.log("Fetching categories for type:", type)
      try {
        const response = await fetch(`/api/categories?type=${type}`)
        if (!response.ok) {
          const errorText = await response.text()
          console.error("Failed to fetch categories:", errorText)
          throw new Error(`Failed to fetch categories: ${response.status} ${errorText}`)
        }
        const data = await response.json()
        console.log("Fetched categories:", data)
        return data
      } catch (error) {
        console.error("Error in category fetch:", error)
        throw error
      }
    },
    retry: 2,
    refetchOnMount: true
  })

  useEffect(() => {
    if (error) {
      console.error("Error loading categories:", error)
      toast.error("Failed to load categories. Please try again.")
    }
  }, [error])

  useEffect(() => {
    if (newCategory) {
      console.log("New category created, setting value:", newCategory.name)
      setValue(newCategory.name)
      onChange(newCategory.name)
    }
  }, [newCategory, onChange])

  useEffect(() => {
    if (value) {
      console.log("Value changed, calling onChange with:", value)
      onChange(value)
    }
  }, [value, onChange])

  // Render a dropdown-style UI manually rather than using Popover
  return (
    <div className="relative w-[200px]" ref={dropdownRef}>
      <Button
        variant="outline"
        type="button"
        className="w-full justify-between"
        onClick={() => setOpen(!open)}
      >
        {value
          ? categories?.find((cat: any) => cat.name === value)?.name
          : "Select category"}
        <span className="ml-2">▼</span>
      </Button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-input bg-background shadow-lg">
          <div className="max-h-60 overflow-auto">
            <div className="py-1">
              <div className="px-2 py-1.5">
                <input
                  className="w-full rounded border border-input px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search category..."
                  onChange={(e) => {
                    console.log("Search input:", e.target.value)
                  }}
                />
              </div>
              
              {isLoading ? (
                <div className="p-4 text-center text-sm">Loading categories...</div>
              ) : error ? (
                <div className="p-4 text-center text-sm text-destructive">
                  Error loading categories
                </div>
              ) : categories?.length === 0 ? (
                <div className="flex flex-col items-center gap-2 p-4">
                  <p>No categories found.</p>
                  <CreateCategoryDialog
                    type={type}
                    successCallback={(category) => {
                      console.log("Category created:", category)
                      setNewCategory(category)
                      setOpen(false)
                    }}
                  />
                </div>
              ) : (
                <>
                  {categories?.map((category: any) => (
                    <div
                      key={category.name}
                      className={cn(
                        "flex cursor-pointer items-center px-3 py-2 hover:bg-accent",
                        value === category.name ? "bg-accent/50" : ""
                      )}
                      onClick={() => {
                        console.log("Category clicked:", category.name)
                        setValue(category.name)
                        setOpen(false)
                      }}
                    >
                      <span className="mr-2">{category.icon}</span>
                      {value === category.name && <Check className="mr-2 h-4 w-4" />}
                      {category.name}
                    </div>
                  ))}
                  <div className="border-t mt-2 pt-2">
                    <div 
                      className="px-3 py-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <CreateCategoryDialog
                        type={type}
                        successCallback={(category) => {
                          console.log("Category created:", category)
                          setNewCategory(category)
                          setOpen(false)
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoryPicker
