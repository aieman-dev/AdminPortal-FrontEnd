"use client"

import React from "react"
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface TabOption {
  id: string
  label: string
  icon?: React.ElementType
}

interface ResponsiveTabsHeaderProps {
  tabs: TabOption[]
  activeTab: string
  onValueChange: (value: string) => void
  className?: string
}

export function ResponsiveTabsHeader({ tabs, activeTab, onValueChange, className }: ResponsiveTabsHeaderProps) {
  return (
    <div className={cn("w-full", className)}>
      
      {/* 1. MOBILE VIEW: Select Dropdown (Visible < md) */}
      <div className="block md:hidden mb-4">
        <Select value={activeTab} onValueChange={onValueChange}>
          <SelectTrigger className="w-full h-14 bg-card border-border shadow-md px-4">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider border-r pr-3">Mode:</span>
              <SelectValue />
            </div>
          </SelectTrigger>

          <SelectContent className="rounded-xl">
            {tabs.map((tab) => (
              <SelectItem 
                key={tab.id} 
                value={tab.id} 
                className="py-3 px-4 focus:bg-indigo-50 dark:focus:bg-indigo-950 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                      "p-1.5 rounded-md transition-colors",
                      activeTab === tab.id ? "bg-indigo-100 text-indigo-700" : "bg-muted text-muted-foreground"
                  )}>
                    {tab.icon && <tab.icon size={18} />}
                  </div>
                  <span className={cn("text-sm font-medium", activeTab === tab.id ? "text-indigo-700 font-bold" : "")}>
                    {tab.label}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2. DESKTOP VIEW: Standard TabsList (Hidden on Mobile) */}
      <div className="hidden md:block overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
          {tabs.map((tab, idx) => (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              className={cn(
                "rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10",
                idx > 0 && "-ml-px" // Connects tabs together without double borders
              )}
            >
              {tab.icon && <tab.icon className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" />}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </div>
  )
}