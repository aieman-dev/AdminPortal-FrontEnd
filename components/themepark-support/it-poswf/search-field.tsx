"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Search } from "lucide-react"

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
    <div className="flex gap-4">
      <div className="flex-1 space-y-2">
        <Label htmlFor="search-input" className="text-sm font-medium">
          {label}
        </Label>
        <Input
          id="search-input"
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          className="h-11"
          disabled={disabled}
        />
      </div>
      <div className="flex items-end">
        <Button onClick={onSearch} disabled={isSearching || disabled} className="h-11">
          <Search className="h-4 w-4 mr-2" />
          {isSearching ? "Searching..." : "Search"}
        </Button>
      </div>
    </div>
  )
}
