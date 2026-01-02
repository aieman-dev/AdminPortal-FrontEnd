"use client";

import { useState } from "react";
import { Search, RotateCcw, Play } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker"; 
import { canDraftPackage } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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

  const filters = [
    { label: "Pending", value: "Pending", color: "#9C6500", hover: "#C27C00" },
    { label: "Active", value: "Active", color: "#006100", hover: "#008000" },
    { label: "Expiring Soon", value: "ExpiringSoon", color: "#FF9800", hover: "#FFB84D" },
    { label: "Expired", value: "Expired", color: "#B91C1C", hover: "#991B1B" },
    { label: "Rejected", value: "Rejected", color: "#9C0005", hover: "#C40007" },
    { label: "Draft", value: "Draft", color: "#4F46E5", hover: "#080087" },
    { label: "Show All", value: "Show All", color: "#9CA3AF", hover: "#B0B6BD" },
  ];

  const visibleFilters = filters.filter(f => {
    if (f.value === "Draft") {
      return canDraftPackage(userDepartment);
    }
    return true;
  });

  const handleRun = () => {
    onDateFilter(startDate || null, endDate || null);
  };

  const handleReset = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSearchQuery("");
    setPackageTypeFilter("All");
    onDateFilter(null, null);
  };

  return (
    <div className="flex flex-col gap-4 mb-6 relative z-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">

          {/* Package Type Filter */}
          <div className="w-[140px]">
            <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                {/* FIX: Added 'w-full' to ensure it fills the 140px container */}
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

          {/* Start Date */}
          <div className="w-[140px]">
            <DatePicker
              date={startDate}
              setDate={setStartDate}
              placeholder="Start Date"
              className="h-9 bg-muted/50 border-transparent hover:bg-muted/80"
            />
          </div>

          {/* End Date */}
          <div className="w-[140px]">
             <DatePicker
              date={endDate}
              setDate={setEndDate}
              placeholder="End Date"
              className="h-9 bg-muted/50 border-transparent hover:bg-muted/80"
            />
          </div>

          {/* Run Button */}
          <Button 
            onClick={handleRun}
            size="sm"
            className="h-9 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md shadow-sm"
          >
            <Play size={14} className="mr-2" /> Run
          </Button>

          {/* Reset Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw size={14} className="mr-2" /> Reset
          </Button>
        </div>

        {/* Search Box */}
        <div className="relative w-64">
           <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search packages..."
            className="w-full h-9 pl-9 pr-4 rounded-md border border-transparent bg-muted/50 text-sm outline-none focus:bg-background focus:border-indigo-500 transition-all placeholder:text-muted-foreground"
          />
          <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-8 mt-3 border-b border-border">
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
                <span
                  className="absolute -left-2 -right-2 -bottom-[2px] h-[3px] rounded-full transition-all duration-200"
                  style={{ backgroundColor: filter.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}