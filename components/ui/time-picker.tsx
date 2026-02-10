"use client"

import * as React from "react"
import { Clock } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
}

export function TimePicker({ date, setDate, disabled, className }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0"))

  const selectedHour = date ? date.getHours().toString().padStart(2, "0") : "00"
  const selectedMinute = date ? Math.floor(date.getMinutes() / 5) * 5 : 0
  const selectedMinuteStr = selectedMinute.toString().padStart(2, "0")

  const handleTimeChange = (type: "hour" | "minute", value: string) => {
    const newDate = date ? new Date(date) : new Date()
    
    if (type === "hour") {
      newDate.setHours(parseInt(value))
    } else {
      newDate.setMinutes(parseInt(value))
    }
    
    // Reset seconds/ms
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    
    setDate(newDate)
  }

  return (
    <div 
      className={cn(
        "flex items-center rounded-md border border-input bg-background px-3 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        "h-11", // Standardized Height
        className
      )}
    >
      <Clock className="mr-2 h-4 w-4 text-muted-foreground opacity-50" />
      
      {/* Hours Select - Ghost Style */}
      <Select
        value={selectedHour}
        onValueChange={(val) => handleTimeChange("hour", val)}
        disabled={disabled}
      >
        <SelectTrigger 
            className="w-[50px] border-0 p-0 h-auto focus:ring-0 shadow-none text-foreground font-medium hover:bg-transparent" 
        >
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent className="h-[200px]">
          {hours.map((h) => (
            <SelectItem key={h} value={h}>{h}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground font-medium mx-1">:</span>

      {/* Minutes Select - Ghost Style */}
      <Select
        value={selectedMinuteStr}
        onValueChange={(val) => handleTimeChange("minute", val)}
        disabled={disabled}
      >
        <SelectTrigger 
            className="w-[50px] border-0 p-0 h-auto focus:ring-0 shadow-none text-foreground font-medium hover:bg-transparent"
        >
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent className="h-[200px]">
          {minutes.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}