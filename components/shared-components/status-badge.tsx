import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_STYLES } from "@/lib/constants"
import { memo } from "react"

interface StatusBadgeProps {
  status: string | null | undefined
  variant?: "default" | "secondary" | "destructive" | "outline"
  colorMap?: Record<string, string>
  className?: string 
}

const FALLBACK_STYLES: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-500/15 dark:text-emerald-400",
    success: "bg-emerald-100 text-emerald-700 border-transparent",
    paid: "bg-emerald-100 text-emerald-700 border-transparent",
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200",
    rejected: "bg-red-100 text-red-700 border-transparent",
    failed: "bg-red-100 text-red-700 border-transparent",
    draft: "bg-indigo-100 text-indigo-700 border-transparent",
    expired: "bg-orange-100 text-orange-700 border-orange-200",
    inactive: "bg-red-100 text-red-700 border-red-200",
    voided: "bg-gray-100 text-gray-600 border-gray-200 decoration-line-through",
    refunded: "bg-purple-100 text-purple-700 border-purple-200"
};


const StatusBadge = memo(({ status, variant, colorMap, className }: StatusBadgeProps) => {
  const safeStatus = status || "N/A"

  let statusKey = safeStatus.toLowerCase().trim();
  if (statusKey === "expiringsoon") statusKey = "expiring";

  const stylesMap = { 
      ...(STATUS_STYLES || FALLBACK_STYLES), 
      ...(colorMap || {}) 
  };

  const colorClass = stylesMap[statusKey] || "bg-gray-100 text-gray-600 border-gray-200"
  const shouldPulse = ["pending", "processing", "syncing"].includes(statusKey);

  return (
    <Badge 
      variant={variant || "outline"} 
      className={cn(
        "border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        colorClass, 
        className,
        shouldPulse && "animate-pulse")}
    >
      {safeStatus}
    </Badge>
  )
});

// Add Display Name (Required for debugging memoized components)
StatusBadge.displayName = "StatusBadge";

export { StatusBadge };