// components/portal/stat-card.tsx
"use client"

import { Card } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, useSpring, useTransform } from "framer-motion"
import { useEffect, useMemo, memo } from "react"

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
  onClick?: () => void
}

const StatCard = memo(({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  valueColor = "text-foreground",
  onClick
}: StatCardProps) => {
    
    // Optimize Parsing Logic
    const { numericValue, isCurrency, isSplit, splitParts } = useMemo(() => {
        const isCurrency = value.includes("RM");
        const isSplit = value.includes("/");
        const splitParts = isSplit ? value.split("/") : [value];
        const numericValue = parseInt(splitParts[0].replace(/[^0-9]/g, '')) || 0;

        return { numericValue, isCurrency, isSplit, splitParts };
    }, [value]);
    
    const spring = useSpring(0, { bounce: 0, duration: 2000 });
    
    // Transform logic 
    const displayValue = useTransform(spring, (current) => {
        const rounded = Math.round(current);
        if (isCurrency) return `RM ${rounded.toLocaleString()}`;
        if (isSplit) return `${rounded} /${splitParts[1]}`;
        return rounded.toLocaleString();
    });

    useEffect(() => {
        spring.set(numericValue);
    }, [spring, numericValue]);

    const activeColorClass = valueColor === "text-foreground" ? "text-primary" : valueColor;

    // --- EXTRACT INNER CONTENT ---
    const cardContent = (
        <Card className="absolute inset-x-0 top-0 h-full hover:h-auto min-h-full flex flex-col overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50 bg-gradient-to-br from-card to-card/50 p-6 hover:z-50">
            <div className="flex items-start justify-between w-full relative z-10">
                <div className="space-y-1 flex-1 min-w-0 pr-2">
                    <div className="text-sm font-medium text-muted-foreground truncate group-hover/wrapper:text-primary transition-colors">
                        {title}
                    </div>
                    
                    <div className="relative">
                        <motion.div 
                            className="flex items-center gap-2"
                            initial={false}
                            animate={{ y: 0 }}
                            whileHover={{ y: -2 }} 
                        >
                            <motion.p className={cn("text-2xl font-semibold leading-none tracking-tight", activeColorClass)}>
                                {displayValue}
                            </motion.p>

                            {trend && (
                                <span className={cn(
                                    "text-[10px] font-medium px-1.5 py-0.5 rounded-full flex items-center shrink-0 opacity-100 group-hover/wrapper:opacity-0 transition-opacity duration-200",
                                    trend.positive 
                                        ? "text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400" 
                                        : "text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {trend.positive ? "↑" : "↓"} {trend.value}
                                </span>
                            )}
                        </motion.div>

                        <div className="grid grid-rows-[0fr] group-hover/wrapper:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-in-out">
                            <div className="overflow-hidden">
                                <p className="text-xs text-muted-foreground/80 mt-2 opacity-0 group-hover/wrapper:opacity-100 transition-opacity duration-500 delay-75">
                                    {description || "No details available"}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn("h-12 w-12 rounded-lg flex items-center justify-center shrink-0 relative transition-all group-hover/wrapper:scale-110 duration-300", activeColorClass)}>
                    <div className="absolute inset-0 bg-current opacity-10 rounded-lg" />
                    <Icon className="h-6 w-6 relative z-10" />
                </div>
            </div>

            <div className={cn("absolute inset-0 bg-gradient-to-br from-current to-transparent opacity-0 group-hover/wrapper:opacity-5 transition-opacity duration-500 pointer-events-none", activeColorClass)} />
        </Card>
    );

    // --- CONDITIONALLY RENDER AS BUTTON OR DIV ---
    if (onClick) {
        return (
            <button 
                type="button"
                onClick={onClick}
                aria-label={`View details for ${title}`}
                className="relative h-28 w-full z-0 group/wrapper cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-xl transition-transform active:scale-[0.98]"
            >
                {cardContent}
            </button>
        );
    }

    return (
        <div className="relative h-28 w-full z-0 group/wrapper">
            {cardContent}
        </div>
    );
});

StatCard.displayName = "StatCard";

export { StatCard };