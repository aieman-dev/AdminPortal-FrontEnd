"use client";

import { useState } from "react";
import { Calendar, Search, RotateCcw, Play } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { canDraftPackage } from "@/lib/auth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const filters = [
    { label: "Pending", value: "Pending", color: "#9C6500", hover: "#C27C00" },
    { label: "Active", value: "Active", color: "#006100", hover: "#008000" },
    { label: "Expiring Soon", value: "ExpiringSoon", color: "#FF9800", hover: "#FFB84D" },
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
    onDateFilter(startDate, endDate);
  };

  const handleReset = () => {
    setStartDate(null);
    setEndDate(null);
    setSearchQuery("");
    setPackageTypeFilter("All");
    onDateFilter(null, null);
  };

  return (
    <div className="flex flex-col gap-4 mb-6 relative z-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">

          {/* Package Type Filter */}
          <div className="flex items-center rounded-full px-3 py-1.5 text-sm bg-gray-100 text-gray-600 relative z-20">
            <Select value={packageTypeFilter} onValueChange={setPackageTypeFilter}>
                {/* FIX: Use !important classes to force override default ShadCN button styles */}
                <SelectTrigger className="w-36 !h-auto !bg-transparent !border-none !shadow-none !p-0 text-sm font-normal text-gray-600 focus:!ring-0 focus:!ring-offset-0 gap-1">
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
          <div className="flex items-center rounded-full px-3 py-1.5 text-sm bg-gray-100 text-gray-600 relative z-20">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="Start Date"
              dateFormat="dd MMM yyyy"
              className="bg-transparent outline-none w-36 text-sm text-gray-800 cursor-pointer"
              popperClassName="!z-50"
            />
            <Calendar size={16} className="ml-1 text-gray-400" />
          </div>

          {/* End Date */}
          <div className="flex items-center rounded-full px-3 py-1.5 text-sm bg-gray-100 text-gray-600 relative z-20">
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              placeholderText="End Date"
              dateFormat="dd MMM yyyy"
              className="bg-transparent outline-none w-36 text-sm text-gray-800 cursor-pointer"
              popperClassName="!z-50"
            />
            <Calendar size={16} className="ml-1 text-gray-400" />
          </div>

          {/* Run Button */}
          <button 
            onClick={handleRun}
            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 dark:bg-white dark:hover:bg-gray-200 text-primary-foreground  text-sm font-medium rounded-full px-4 py-1.5 shadow transition"
          >
            <Play size={14} /> Run
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition"
          >
            <RotateCcw size={14} /> Reset All
          </button>
        </div>

        {/* Search Box */}
        <div className="flex items-center rounded-full px-3 py-1.5 text-sm w-56 bg-gray-100 text-gray-600">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="bg-transparent outline-none w-full placeholder-gray-400 text-gray-800"
          />
          <Search size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-8 mt-3 border-b border-gray-200">
        {visibleFilters.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`relative pb-2 text-[15px] font-semibold transition-all duration-150`}
              style={{ color: isActive ? filter.color : "#88888D" }}
              onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = filter.hover;
              }}
              onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#88888D";
              }}
            >
              {filter.label}
              {isActive && (
                <span
                  className="absolute -left-2 -right-2 -bottom-[2px] h-[4px] rounded-full transition-all duration-200"
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