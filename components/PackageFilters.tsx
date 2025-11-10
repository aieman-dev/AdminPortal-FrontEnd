//scr/components/PackageFilters.tsx
"use client";

import { useState } from "react";
import { Calendar, Search, RotateCcw, Play } from "lucide-react";
import DatePicker from "react-datepicker";

interface PackageFiltersProps {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export default function PackageFilters({
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
}: PackageFiltersProps) {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const filters = [
    { label: "Active", value: "active", color: "#006100", hover: "#008000" },
    { label: "Expired", value: "expired", color: "#6D28D9", hover: "#4900BA" },
    { label: "Expiring Soon", value: "expiring", color: "#FF9800", hover: "#FFB84D" },
    { label: "Pending", value: "pending", color: "#9C6500", hover: "#C27C00" },
    { label: "Rejected", value: "rejected", color: "#9C0005", hover: "#C40007" },
    { label: "Draft", value: "draft", color: "#4F46E5", hover: "#080087" },
    { label: "Show All", value: "all", color: "#9CA3AF", hover: "#B0B6BD" },
  ];

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* Top row: Date + Run/Reset + Search */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">

          {/* Start Date Picker */}
          <div className="flex items-center rounded-full px-3 py-1.5 text-sm bg-gray-100 text-gray-600">
            <DatePicker
              selected={startDate}
              onChange={(date) => setStartDate(date)}
              placeholderText="Start Date"
              dateFormat="dd MMM yyyy"
              className="bg-transparent outline-none w-36 text-sm text-gray-800"
            />
            <Calendar
              size={16}
              className="ml-1 cursor-pointer text-gray-400 hover:text-indigo-500"
              onClick={() => document.querySelector<HTMLInputElement>('input[placeholder="Start Date"]')?.focus()}
            />
          </div>

          {/* End Date Picker */}
          <div className="flex items-center rounded-full px-3 py-1.5 text-sm bg-gray-100 text-gray-600">
            <DatePicker
              selected={endDate}
              onChange={(date) => setEndDate(date)}
              placeholderText="End Date"
              dateFormat="dd MMM yyyy"
              className="bg-transparent outline-none w-36 text-sm text-gray-800"
            />
            <Calendar
              size={16}
              className="ml-1 cursor-pointer text-gray-400 hover:text-indigo-500"
              onClick={() => document.querySelector<HTMLInputElement>('input[placeholder="End Date"]')?.focus()}
            />
          </div>

          {/* Run Button */}
          <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-full px-4 py-1.5 shadow transition">
            <Play size={14} /> Run
          </button>

          {/* Reset Button */}
          <button
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 transition"
            onClick={() => {
              setStartDate(null);
              setEndDate(null);
              setSearchQuery("");
            }}
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

      {/* Bottom row: Filters */}
      <div className="flex flex-wrap gap-8 mt-3 border-b border-gray-200">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.value;
          return (
            <button
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              className={`relative pb-2 text-[15px] font-semibold transition-all`}
              style={{
                color: isActive ? filter.color : "#88888D",
              }}
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