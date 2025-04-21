import type { TransactionType } from "@/lib/types"
import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import CreateCategoryDialog from "./CreateCategoryDialog"

interface CategoryPickerProps {
  type: TransactionType
  onChange: (value: string) => void
}

function CategoryPicker({ type, onChange }: CategoryPickerProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState("")
  const [newCategory, setNewCategory] = useState<any>(null)

  const { data: categories, isLoading } = useQuery({
    queryKey: ["categories", type],
    queryFn: async () => {
      const response = await fetch(`/api/categories?type=${type}`)
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      return response.json()
    },
  })

  useEffect(() => {
    if (newCategory) {
      setValue(newCategory.name)
      onChange(newCategory.name)
    }
  }, [newCategory, onChange])

  useEffect(() => {
    if (value) {
      onChange(value)
    }
  }, [value, onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? categories?.find((cat: any) => cat.name === value)?.name
            : "Select category"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Search category..." />
          <CommandList>
            <CommandEmpty className="flex flex-col items-center gap-2">
              <p>No category found.</p>
              <CreateCategoryDialog
                type={type}
                successCallback={(category) => setNewCategory(category)}
              />
            </CommandEmpty>
            <CommandGroup>
              {categories?.map((category: any) => (
                <CommandItem
                  key={category.name}
                  value={category.name}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? "" : currentValue)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === category.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {category.name}
                </CommandItem>
              ))}
              <CommandItem className="mt-2 bg-accent/50">
                <CreateCategoryDialog
                  type={type}
                  successCallback={(category) => setNewCategory(category)}
                />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default CategoryPicker
