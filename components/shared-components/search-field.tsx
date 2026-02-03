// components/themepark-support/it-poswf/search-field.tsx
"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search, X, Loader2 } from "lucide-react"
import { ReactNode } from "react"

interface SearchFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  onSearch: () => void
  isSearching?: boolean
  disabled?: boolean
  extraFilters?: ReactNode 
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
  onSearch,
  isSearching = false,
  disabled = false,
  extraFilters
}: SearchFieldProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
        <Label className="text-sm font-medium ml-1">{label}</Label>
        <div className="flex flex-col md:flex-row gap-2"> 
            
            {/* 1. Input Field (Grows to fill space) */}
            <div className="relative flex-1">
                <Input
                  placeholder={placeholder}
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === "Enter" && !isSearching) {
                          onSearch();
                      }
                  }}
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
            
            {/* 2. Extra Filters (The Dropdown) */}
            {extraFilters && (
                <div className="shrink-0 min-w-[180px]">
                    {extraFilters}
                </div>
            )}

            {/* 3. Search Button */}
            <Button 
                onClick={onSearch} 
                disabled={isSearching || disabled} 
                className="h-11 px-8 shrink-0 transition-all active:scale-95 shadow-sm"
            >
                {isSearching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
                Search
            </Button>
        </div>
    </div>
  )
}