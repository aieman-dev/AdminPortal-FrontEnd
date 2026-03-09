"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { itPoswfService } from "@/services/themepark-support"
import { Terminal } from "@/type/themepark-support"
import { useDebounce } from "@/hooks/use-debounce"

interface TerminalSelectorProps {
  value: string
  onChange: (value: string) => void
  onTerminalSelect?: (terminal: Terminal) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TerminalSelector({
  value,
  onChange,
  onTerminalSelect,
  label = "Terminal Search & Select",
  placeholder = "Search terminal name or ID",
  disabled = false,
  className
}: TerminalSelectorProps) {

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const debouncedQuery = useDebounce(query, 300)

  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [loading, setLoading] = useState(false)
  
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null)

  // 1. Debounced Search Effect
  useEffect(() => {
    let isActive = true;
    const fetchTerminals = async () => {
      if (!debouncedQuery.trim()) {
        if (terminals.length === 0) setTerminals([])
        return
      }

      setLoading(true)
      try {
        const response = await itPoswfService.searchTerminals(debouncedQuery)
        if (isActive) {
            if (response.success && response.data) {
              setTerminals(response.data.slice(0, 30))
            } else {
              setTerminals([])
            }
        }
      } catch (error) {
        console.error("Terminal search error:", error)
        setTerminals([])
      } finally {
        if (isActive) setLoading(false)
      }
    }

    fetchTerminals()
    return () => { 
        isActive = false; 
      }
    }, [debouncedQuery])


  // 2. Handle Selection
  const handleSelect = (terminal: Terminal) => {
    setSelectedTerminal(terminal)
    onChange(terminal.id)
    if (onTerminalSelect) onTerminalSelect(terminal)
    setOpen(false)
  }

  // Display label logic: Use selected object -> fallback to search list -> fallback to ID
  const displayLabel = selectedTerminal?.terminalName 
    || terminals.find((t) => t.id === value)?.terminalName 
    || (value ? `Terminal ID: ${value}` : "Select terminal...")

  return (
    <div className="flex flex-col gap-3">
      {label && <Label className="mb-0">{label}</Label>}
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal", className)}
            disabled={disabled}
          >
            <span className="truncate">{displayLabel}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-[300px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={placeholder} 
              value={query} 
              onValueChange={setQuery} 
            />
            <CommandList>
              {loading && (
                <div className="py-6 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                </div>
              )}
              
              {!loading && terminals.length === 0 && (
                <CommandEmpty>No terminal found.</CommandEmpty>
              )}

              <CommandGroup>
                {terminals.map((t) => (
                  <CommandItem
                    key={t.id}
                    value={t.id}
                    onSelect={() => handleSelect(t)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === t.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-col">
                      <span>{t.terminalName}</span>
                      <span className="text-xs text-muted-foreground">ID: {t.id}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}