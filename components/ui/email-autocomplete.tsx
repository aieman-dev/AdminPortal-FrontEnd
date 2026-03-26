"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const COMMON_DOMAINS = [
  "i-city.my",
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "email.com"
]

export interface EmailAutocompleteProps extends React.ComponentProps<"input"> {}

export function EmailAutocomplete({ className, value, onChange, onKeyDown, ...props }: EmailAutocompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(value?.toString() || "")
  const [selectedIndex, setSelectedIndex] = React.useState(0) // 1. Track selection
  
  const id = React.useId()
  const listboxId = `${id}-listbox`
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Sync internal state if prop changes
  React.useEffect(() => { setInputValue(value?.toString() || "") }, [value])

  // Filter logic
  const query = inputValue.split("@")[1] || ""
  const filteredDomains = COMMON_DOMAINS.filter(d => d.startsWith(query))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    setInputValue(newVal)
    setSelectedIndex(0)
    if (onChange) onChange(e)

    if (newVal.includes("@")) {
      const parts = newVal.split("@")
      setIsOpen(parts.length === 2 && !COMMON_DOMAINS.includes(parts[1]))
    } else {
      setIsOpen(false)
    }
  }

  const handleSelectDomain = (domain: string) => {
    const parts = inputValue.split("@")
    if (parts.length > 0) {
      const finalValue = `${parts[0]}@${domain}`
      setInputValue(finalValue)
      setIsOpen(false)
      if (onChange) {
        onChange({ target: { value: finalValue }, currentTarget: { value: finalValue } } as any)
      }
      containerRef.current?.querySelector("input")?.focus()
    }
  }

  // Handle click outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // 2. Keyboard Navigation Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") { e.preventDefault(); return; }
    if (!isOpen || filteredDomains.length === 0) {
      if (onKeyDown) onKeyDown(e);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredDomains.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredDomains.length) % filteredDomains.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      e.stopPropagation(); 
      handleSelectDomain(filteredDomains[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else {
      if (onKeyDown) onKeyDown(e);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <Input
        {...props}
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className={cn("w-full", className)}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={isOpen ? `${id}-option-${selectedIndex}` : undefined}
      />
      
      {isOpen && filteredDomains.length > 0 && (
        <div 
            id={listboxId}
            role="listbox"
            className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md animate-in fade-in-0 zoom-in-95 overflow-hidden"
        >
          <div className="p-1">
             <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Suggestions</div>
             {filteredDomains.map((domain, index) => (
                <button
                  key={domain}
                  type="button"
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === selectedIndex}
                  tabIndex={-1} 
                  onClick={() => handleSelectDomain(domain)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors border-none bg-transparent text-left",
                    index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="text-muted-foreground">{inputValue.split("@")[0]}@</span>
                  <span className="font-medium text-foreground">{domain}</span>
                </button>
             ))}
          </div>
        </div>
      )}
    </div>
  )
}