import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_STYLES } from "@/lib/constants"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  colorMap?: Record<string, string>
  className?: string 
}

const FALLBACK_STYLES: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700 border-transparent dark:bg-emerald-500/15 dark:text-emerald-400",
    pending: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
    rejected: "bg-red-100 text-red-700 border-transparent",
    draft: "bg-indigo-100 text-indigo-700 border-transparent",
    expired: "bg-orange-100 text-orange-700 border-orange-200",
    inactive: "bg-red-100 text-red-700 border-red-200",
    voided: "bg-gray-100 text-gray-600 border-gray-200 decoration-line-through"
};

export function StatusBadge({ status, variant, colorMap, className }: StatusBadgeProps) {
  const safeStatus = status ?? "N/A"

  let statusKey = safeStatus.toLowerCase().trim();
  if (statusKey === "expiringsoon") statusKey = "expiring";

  const stylesMap = STATUS_STYLES || FALLBACK_STYLES;

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
}