'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface MultiSelectOption {
  label: string
  value: string
  disabled?: boolean
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  searchPlaceholder?: string
}

export function MultiSelect({
  options,
  selectedValues,
  onChange,
  placeholder = 'নির্বাচন করুন',
  className,
  disabled = false,
  searchPlaceholder = 'খুঁজুন...',
}: MultiSelectProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter((v) => v !== value))
    } else {
      onChange([...selectedValues, value])
    }
  }

  const handleRemove = (value: string) => {
    onChange(selectedValues.filter((v) => v !== value))
  }

  const handleClear = () => {
    onChange([])
  }

  const selectedLabels = options
    .filter((opt) => selectedValues.includes(opt.value))
    .map((opt) => opt.label)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('h-auto min-h-10 w-full justify-between text-left font-normal', className)}
          disabled={disabled}
        >
          <div className="flex flex-wrap gap-1 flex-1 items-center">
            {selectedValues.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              <>
                {selectedLabels.slice(0, 3).map((label, i) => (
                  <Badge key={selectedValues[i]} variant="secondary" className="text-xs gap-1">
                    {label}
                    <span
                      className="cursor-pointer hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemove(selectedValues[i])
                      }}
                    >
                      <X className="size-3" />
                    </span>
                  </Badge>
                ))}
                {selectedValues.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedValues.length - 3} আরও
                  </Badge>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {selectedValues.length > 0 && (
              <span
                className="cursor-pointer hover:text-destructive p-0.5"
                onClick={(e) => {
                  e.stopPropagation()
                  handleClear()
                }}
              >
                <X className="size-3.5" />
              </span>
            )}
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full min-w-[200px] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>কোনো অপশন পাওয়া যায়নি</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleSelect(option.value)}
                  disabled={option.disabled}
                  className="flex items-center gap-2"
                >
                  <div
                    className={cn(
                      'size-4 rounded border flex items-center justify-center shrink-0',
                      selectedValues.includes(option.value)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {selectedValues.includes(option.value) && <Check className="size-3" />}
                  </div>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
