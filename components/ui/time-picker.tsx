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

interface TimePickerProps {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  disabled?: boolean
}

export function TimePicker({ date, setDate, disabled }: TimePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"))
  const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, "0")) // 5-minute increments

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
    
    // Reset seconds/ms for cleanliness
    newDate.setSeconds(0)
    newDate.setMilliseconds(0)
    
    setDate(newDate)
  }

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative">
        <Select
          value={selectedHour}
          onValueChange={(val) => handleTimeChange("hour", val)}
          disabled={disabled}
        >
          {/* UPDATED WIDTH: Increased to w-[72px] for better spacing */}
          <SelectTrigger className="w-[72px] h-9">
            <SelectValue placeholder="HH" />
          </SelectTrigger>
          <SelectContent className="h-[200px]">
            {hours.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <span className="text-muted-foreground font-medium">:</span>
      <div className="relative">
        <Select
          value={selectedMinuteStr}
          onValueChange={(val) => handleTimeChange("minute", val)}
          disabled={disabled}
        >
          {/* UPDATED WIDTH: Increased to w-[72px] */}
          <SelectTrigger className="w-[72px] h-9">
            <SelectValue placeholder="MM" />
          </SelectTrigger>
          <SelectContent className="h-[200px]">
            {minutes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Clock className="h-4 w-4 text-muted-foreground ml-1.5" />
    </div>
  )
}