"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, X, Loader2  } from "lucide-react"

interface SearchFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  isSearching?: boolean
  disabled?: boolean
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  isSearching = false,
  disabled = false,
}: SearchFieldProps) {
  return (
    <div className="flex gap-4 items-end">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search-input" className="text-sm font-medium ml-1">{label}</Label>
        <div className="relative">
            <Input
              id="search-input"
              placeholder={placeholder}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              className="h-11 pr-10 shadow-xs focus-visible:ring-primary/20"
              disabled={disabled || isSearching}
            />
            {value && !isSearching && (
                <button 
                    onClick={() => onChange("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
      </div>
      <div>
        <Button 
        onClick={onSearch} 
        disabled={isSearching || disabled || !value.trim()} 
        className="h-11 px-8 transition-all active:scale-95 shadow-sm"
      >
        {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
        Search
      </Button>
    </div>
    </div>
  )
}
