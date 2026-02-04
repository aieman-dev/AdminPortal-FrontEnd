"use client"

import * as React from "react"
import { format, setMonth, setYear, addYears, getYear, addMonths, startOfYear } from "date-fns"
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DatePickerProps {
  date?: Date
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  fromDate?: Date
  minDate?: Date 
}

type ViewMode = "calendar" | "month" | "year"

export function DatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  className,
  disabled = false,
  fromDate,
  minDate
}: DatePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [view, setView] = React.useState<ViewMode>("calendar")
  const [navDate, setNavDate] = React.useState<Date>(new Date())

  // Calculate year range for the Year View
  const currentYear = new Date().getFullYear()
  const maxYear = currentYear + 5 // Example: Cap at 2030 (or 2026 per your request)
  const minYear = 2010

  // Sync state when opening
  React.useEffect(() => {
    if (isOpen) {
      setNavDate(date || new Date())
      setView("calendar")
    }
  }, [isOpen, date])

  // --- ACTIONS ---

  const handlePrev = () => {
    if (view === "year") setNavDate(addYears(navDate, -12))
    else if (view === "month") setNavDate(addYears(navDate, -1))
    else setNavDate(addMonths(navDate, -1))
  }

  const handleNext = () => {
    if (view === "year") setNavDate(addYears(navDate, 12))
    else if (view === "month") setNavDate(addYears(navDate, 1))
    else setNavDate(addMonths(navDate, 1))
  }

  const handleYearSelect = (year: number) => {
    setNavDate(setYear(navDate, year))
    setView("calendar") 
  }

  const handleMonthSelect = (monthIndex: number) => {
    setNavDate(setMonth(navDate, monthIndex))
    setView("calendar")
  }

  // --- RENDERERS ---

  const Header = () => {
    const navYear = getYear(navDate)
    const monthName = format(navDate, "MMMM") 
    
    // Logic for Year View Range label
    const startYear = Math.floor(navYear / 12) * 12
    const endYear = startYear + 11
    const yearLabel = view === "year" ? `${startYear} - ${endYear}` : navYear

    return (
      <div className="flex items-center justify-between py-2 px-2">
        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={handlePrev}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex gap-1 font-medium">
            {/* MONTH BUTTON  */}
            {view !== "year" && (
                <Button 
                    variant="ghost" 
                    className={cn(
                        "h-7 text-sm font-semibold px-2", 
                        view === "month" && "bg-accent text-accent-foreground" 
                    )}
                    onClick={() => setView("month")}
                >
                    {monthName}
                </Button>
            )}

            {/* YEAR BUTTON */}
            <Button 
                variant="ghost" 
                className={cn(
                    "h-7 text-sm font-semibold px-2",
                    view === "year" && "bg-accent text-accent-foreground" 
                )}
                onClick={() => setView("year")}
            >
                {yearLabel}
            </Button>
        </div>

        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-50 hover:opacity-100" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  const renderYears = () => {
    const navYear = getYear(navDate)
    const startYear = Math.floor(navYear / 12) * 12
    const years = Array.from({ length: 12 }, (_, i) => startYear + i)
    const selectedYear = date ? getYear(date) : undefined

    return (
      <div className="grid grid-cols-3 gap-2 p-2">
        {years.map((year) => {
             const isFuture = year > maxYear
             
             return (
                <Button
                    key={year}
                    disabled={isFuture}
                    variant={year === selectedYear ? "default" : "ghost"}
                    className={cn(
                        "h-9 w-full text-sm font-normal",
                        year === getYear(navDate) && !selectedYear && "border border-primary text-primary"
                    )}
                    onClick={() => handleYearSelect(year)}
                >
                    {year}
                </Button>
             )
        })}
      </div>
    )
  }

  const renderMonths = () => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ]
    const selectedMonth = date && getYear(date) === getYear(navDate) ? date.getMonth() : undefined

    return (
      <div className="grid grid-cols-3 gap-2 p-2">
        {months.map((m, i) => (
          <Button
            key={m}
            variant={i === selectedMonth ? "default" : "ghost"}
            className={cn(
                "h-9 w-full text-sm font-normal",
                i === selectedMonth && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => handleMonthSelect(i)}
          >
            {m}
          </Button>
        ))}
      </div>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal active:scale-100 h-11",
            !date && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd MMM yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-auto p-0" align="start">
        
        {/* SHARED CUSTOM HEADER */}
        <Header />

        <div className="min-w-[200px] border-t">
            {view === "calendar" && (
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                        if (d) {
                            setDate(d);
                            setIsOpen(false);
                        }
                    }}
                    month={navDate} 
                    onMonthChange={setNavDate}
                    disabled={(d) => (minDate || fromDate) ? d < (minDate || fromDate!) : false}
                    initialFocus
                    // HIDE DEFAULT HEADER
                    classNames={{
                        caption: "hidden", 
                        nav: "hidden",
                        month: "space-y-4 w-full",
                        head_row: "flex w-full mt-2",
                        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                        row: "flex w-full mt-2",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                        day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
                    }}
                />
            )}
            
            {view === "year" && renderYears()}
            {view === "month" && renderMonths()}
        </div>
      </PopoverContent>
    </Popover>
  )
}