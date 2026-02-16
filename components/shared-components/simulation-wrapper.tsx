"use client"

import React, { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SimulationWrapperProps {
  isSimulating: boolean
  children: ReactNode
  className?: string
}

export function SimulationWrapper({ 
  isSimulating, 
  children, 
  className 
}: SimulationWrapperProps) {
  return (
    <div className={cn(
        "transition-all duration-500 ease-in-out relative",
        // Add padding to container to prevent border clipping
        isSimulating ? "p-1.5" : "p-0", 
        className
    )}>
        
        {/* BACKGROUND VISUALS (Only visible in Simulation) */}
        {isSimulating && (
          <div className="absolute inset-0 z-0 rounded-xl border-4 border-amber-400/50 border-dashed bg-amber-50/40 dark:bg-amber-900/10 pointer-events-none animate-in fade-in duration-500">
              {/* WATERMARK */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] overflow-hidden">
                  <span className="text-[120px] font-black -rotate-12 text-amber-900 dark:text-amber-100 whitespace-nowrap select-none">
                      SIMULATION MODE
                  </span>
              </div>
          </div>
        )}

        {/* CONTENT CONTAINER */}
        <div className={cn(
            "relative z-10 transition-all duration-300 h-full",
            // Scale down slightly to fit inside the dashed border
            isSimulating && "scale-[0.98] origin-center" 
        )}>
            {children}
        </div>
    </div>
  )
}