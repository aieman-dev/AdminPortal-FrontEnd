// components/PackageFilters.tsx
"use client";

import { useState } from "react";
import { Search, RotateCcw, Play, Filter, X } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker"; 
import { canDraftPackage } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import { STATUS_COLORS } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";

interface PackageFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onDateFilter: (start: Date | null, end: Date | null) => void;
  userDepartment?: string;
  packageTypeFilter: string;
  setPackageTypeFilter: (type: string) => void;
}

export default function PackageFilters({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  onDateFilter,
  userDepartment,
  packageTypeFilter,
  setPackageTypeFilter
}: PackageFiltersProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filters = [
    { label: "Pending", value: "Pending", color: STATUS_COLORS["Pending"] },
    { label: "Active", value: "Active", color: STATUS_COLORS["Active"] },
    { label: "Expiring Soon", value: "ExpiringSoon", color: STATUS_COLORS["ExpiringSoon"] },
    { label: "Expired", value: "Expired", color: STATUS_COLORS["Expired"] },
    { label: "Rejected", value: "Rejected", color: STATUS_COLORS["Rejected"] },
    { label: "Draft", value: "Draft", color: STATUS_COLORS["Draft"] },
    { label: "Show All", value: "Show All", color: STATUS_COLORS["Show All"] },
  ];

  const visibleFilters = filters.filter(f => {
    if (f.value === "Draft") return canDraftPackage(userDepartment);
    return true;
  });

  const handleRun = () => {
    onDateFilter(startDate || null, endDate || null);
    setIsFilterOpen(false);
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchQuery("");
    setPackageTypeFilter("All");
    setActiveFilter("Pending");
    onDateFilter(null, null);
    setIsFilterOpen(false);
  };

  const activeCount = [
    packageTypeFilter !== "All",
    startDate,
    endDate
  ].filter(Boolean).length;

  // --- MOBILE FILTER CONTENT ---
  const MobileFilterContent = () => (
    // FIX: Added px-6 to ensure content doesn't touch the bezel
    <div className="space-y-6 py-6 px-6"> 
      {/* Status Selection */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium leading-none text-foreground/80">Status</h4>
        <div className="flex flex-wrap gap-3">
          {visibleFilters.map((filter) => {
            const isActive = activeFilter === filter.value;
            return (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                  isActive 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 shadow-sm"
                    : "bg-background border-input text-muted-foreground hover:bg-muted"
                }`}
              >
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Package Type */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium leading-none text-foreground/80">Package Type</h4>
        <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
            <SelectTrigger className="w-full h-12"><SelectValue placeholder="All Types" /></SelectTrigger>
            <SelectContent>
                <SelectItem value="All">All Types</SelectItem>
                <SelectItem value="Entry">Entry</SelectItem>
                <SelectItem value="Point">Point</SelectItem>
                <SelectItem value="RewardP">Reward Point</SelectItem>
            </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium leading-none text-foreground/80">Date Range</h4>
        <div className="grid grid-cols-2 gap-3">
            <DatePicker date={startDate} setDate={setStartDate} placeholder="Start" className="h-12" />
            <DatePicker date={endDate} setDate={setEndDate} placeholder="End" className="h-12" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 mb-6 relative z-10">
      
      {/* === MOBILE HEADER === */}
      <div className="flex md:hidden gap-2 items-center">
        <div className="relative flex-1">
           <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages..."
            className="w-full h-11 pl-10 bg-background shadow-sm border-gray-200 dark:border-gray-800"
          />
          <Search size={18} className="absolute left-3 top-3 text-muted-foreground" />
        </div>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 relative bg-background shadow-sm border-gray-200 dark:border-gray-800">
              <Filter size={18} className="text-foreground" />
              {activeCount > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-indigo-600 rounded-full border-2 border-background flex items-center justify-center">
                    <span className="sr-only">Filters active</span>
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl h-[85vh] px-0">
            <SheetHeader className="text-left px-6 pb-2 border-b">
              <SheetTitle className="text-xl">Filters</SheetTitle>
              <SheetDescription>Refine your package list</SheetDescription>
            </SheetHeader>
            
            <div className="overflow-y-auto max-h-[calc(85vh-140px)]">
                <div className="space-y-6 py-6 px-6"> 
                  {/* Status Selection */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium leading-none text-foreground/80">Status</h4>
                    <div className="flex flex-wrap gap-3">
                      {visibleFilters.map((filter) => {
                        const isActive = activeFilter === filter.value;
                        return (
                          <button
                            key={filter.value}
                            onClick={() => setActiveFilter(filter.value)}
                            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                              isActive 
                                ? "bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300 shadow-sm"
                                : "bg-background border-input text-muted-foreground hover:bg-muted"
                            }`}
                          >
                            {filter.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Package Type */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium leading-none text-foreground/80">Package Type</h4>
                    <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                        <SelectTrigger className="w-full h-12"><SelectValue placeholder="All Types" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Types</SelectItem>
                            <SelectItem value="Entry">Entry</SelectItem>
                            <SelectItem value="Point">Point</SelectItem>
                            <SelectItem value="RewardP">Reward Point</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium leading-none text-foreground/80">Date Range</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <DatePicker date={startDate} setDate={setStartDate} placeholder="Start" className="h-12" />
                        <DatePicker date={endDate} setDate={setEndDate} placeholder="End" className="h-12" />
                    </div>
                  </div>
                </div>
              </div>

            <SheetFooter className="flex-row gap-3 pt-4 px-6 border-t mt-auto absolute bottom-6 w-full">
               <Button variant="outline" className="flex-1 h-12" onClick={handleReset}>Reset</Button>
               <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 h-12" onClick={handleRun}>Apply Filters</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* === DESKTOP TOOLBAR (Hidden on Mobile) === */}
      <div className="hidden md:flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-[140px]">
            <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                <SelectTrigger className="w-full h-9 bg-muted/50 border-transparent hover:bg-muted/80">
                    <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Entry">Entry</SelectItem>
                    <SelectItem value="Point">Point</SelectItem>
                    <SelectItem value="RewardP">Reward Point</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="w-[140px]"><DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" className="h-9 bg-muted/50 border-transparent hover:bg-muted/80" /></div>
          <div className="w-[140px]"><DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" className="h-9 bg-muted/50 border-transparent hover:bg-muted/80" /></div>
          <Button onClick={handleRun} size="sm" className="h-9 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-sm">
            <Play size={14} className="mr-2" /> Run
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 text-muted-foreground hover:text-foreground">
            <RotateCcw size={14} className="mr-2" /> Reset
          </Button>
        </div>
        <div className="relative w-64">
           <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages..."
            className="w-full h-9 pl-9 pr-4 bg-muted/50 border-transparent focus:bg-background"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
        </div>
      </div>

      {/* === DESKTOP TABS (Hidden on Mobile - Chips shown in Sheet instead) === */}
      <div className="hidden md:flex flex-wrap gap-8 mt-3 border-b border-border">
        {visibleFilters.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`relative pb-2 text-[15px] font-semibold transition-all duration-150`}
              style={{ color: isActive ? filter.color : "var(--muted-foreground)" }}
            >
              {filter.label}
              {isActive && (
                <span className="absolute -left-2 -right-2 -bottom-[2px] h-[3px] rounded-full transition-all duration-200" style={{ backgroundColor: filter.color }} />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Mobile Active Filter Label */}
      <div className="md:hidden flex items-center justify-between">
          <Badge variant="secondary" className="rounded-md font-medium text-xs">
             Viewing: {visibleFilters.find(f => f.value === activeFilter)?.label}
          </Badge>
          <span className="text-[10px] text-muted-foreground">Tap filter icon to change</span>
      </div>
    </div>
  );
}