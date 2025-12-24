"use client"

import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, useSpring, useTransform } from "framer-motion"
import { useEffect } from "react"

interface StatCardProps {
  title: string
  value: string
  description?: string
  icon: LucideIcon
  trend?: {
    value: string
    positive: boolean
  }
  valueColor?: string
}

export function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  valueColor = "text-foreground"
}: StatCardProps) {
    // --- INTELLIGENT PARSING LOGIC ---
    // 1. Check if it's currency
    const isCurrency = value.includes("RM");
    
    // 2. Check if it's a split value like "42 / 45"
    const isSplit = value.includes("/");
    const splitParts = isSplit ? value.split("/") : [value];
    
    // 3. Extract the number to animate (always the first part)
    // Remove non-numeric chars but keep decimals if needed
    const numericValue = parseInt(splitParts[0].replace(/[^0-9]/g, '')) || 0;
    
    // 4. Setup Animation
    const spring = useSpring(0, { bounce: 0, duration: 2000 });
    
    const displayValue = useTransform(spring, (current) => {
        const rounded = Math.round(current);

        // Case A: Currency (RM 45,231)
        if (isCurrency) {
             return `RM ${rounded.toLocaleString()}`;
        }
        
        // Case B: Split Value (42 / 45) -> Animate 42, keep / 45 static
        if (isSplit) {
            return `${rounded} /${splitParts[1]}`;
        }

        // Case C: Standard Number
        return rounded.toLocaleString();
    });

    useEffect(() => {
        spring.set(numericValue);
    }, [spring, numericValue]);

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          
          <div className="flex items-center gap-2">
            <motion.p className={cn("text-2xl font-semibold", valueColor)}>
               {displayValue}
            </motion.p>

            {trend && (
                <span className={cn(
                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center",
                    trend.positive 
                        ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
                        : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                )}>
                    {trend.positive ? "↑" : "↓"} {trend.value}
                </span>
            )}
          </div>

          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
    </Card>
  )
}