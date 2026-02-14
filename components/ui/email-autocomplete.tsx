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
  
  const containerRef = React.useRef<HTMLDivElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Sync internal state if prop changes
  React.useEffect(() => {
    setInputValue(value?.toString() || "")
  }, [value])

  // Filter logic
  const query = inputValue.split("@")[1] || ""
  const filteredDomains = COMMON_DOMAINS.filter(d => d.startsWith(query))

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value
    setInputValue(newVal)
    setSelectedIndex(0) // Reset selection on typing
    
    if (onChange) onChange(e)

    // Open logic: contains exactly one '@' and domain isn't fully matched yet
    if (newVal.includes("@")) {
      const parts = newVal.split("@")
      if (parts.length === 2 && !COMMON_DOMAINS.includes(parts[1])) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
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
      setSelectedIndex(0)
      
      // Trigger standard React change event for parent forms
      if (onChange) {
        const event = {
          target: { value: finalValue },
          currentTarget: { value: finalValue }
        } as React.ChangeEvent<HTMLInputElement>
        onChange(event)
      }
      
      // Refocus input to keep typing flow
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
    if ( e.key === " "){
      e.preventDefault();
      return;
    }
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
      // 3. Select the highlighted item
      e.preventDefault();
      e.stopPropagation(); // Stop form submission / focus change
      handleSelectDomain(filteredDomains[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else {
      // For any other key, pass it to the parent (e.g. user typing letters)
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
        // Prevent browser autocomplete from covering our menu
        aria-autocomplete="list"
        aria-expanded={isOpen}
      />
      
      {isOpen && filteredDomains.length > 0 && (
        <div 
            ref={listRef}
            className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md animate-in fade-in-0 zoom-in-95 overflow-hidden"
        >
          <div className="p-1">
             <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Suggestions</div>
             {filteredDomains.map((domain, index) => (
                <div
                  key={domain}
                  onClick={() => handleSelectDomain(domain)}
                  onMouseEnter={() => setSelectedIndex(index)} // Sync mouse hover with keyboard index
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                    index === selectedIndex ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <span className="text-muted-foreground">{inputValue.split("@")[0]}@</span>
                  <span className="font-medium text-foreground">{domain}</span>
                </div>
             ))}
          </div>
        </div>
      )}
    </div>
  )
}