import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils" // Ensure you have this utility, or just use template literals

interface StatusBadgeProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  colorMap?: Record<string, string>
  className?: string // Added optional className prop for overrides
}

export function StatusBadge({ status, variant, colorMap, className }: StatusBadgeProps) {
  const defaultColorMap: Record<string, string> = {
    // Financial Statuses
    paid: "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200",
    pending: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200",
    failed: "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200",
    refund: "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200",
    
    // Transaction Types
    credit: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200",
    debit: "bg-gray-500/10 text-gray-600 hover:bg-gray-500/20 border-gray-200",
    purchase: "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200", 
    consume: "bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200", 
    
    // Operational Statuses
    active: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200", 
    expired: "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200", 
    inactive: "bg-red-100 text-red-700 hover:bg-red-200 border-red-200",
    voided: "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 decoration-line-through",

    // --- Sync Statuses (NEW) ---
    synced: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200", 
    error: "bg-rose-100 text-rose-700 hover:bg-rose-200 border-rose-200",
  }

  const safeStatus = status ?? "N/A"
  const colors = colorMap || defaultColorMap
  const statusLower = safeStatus.toLowerCase().trim()
  const colorClass = colors[statusLower] || "bg-gray-100 text-gray-600 border-gray-200"

  return (
    <Badge 
      variant={variant || "outline"} 
      // Added 'w-24' (fixed width) and 'justify-center' (center text)
      className={cn("border w-24 justify-center whitespace-nowrap", colorClass, className)}
    >
      {safeStatus}
    </Badge>
  )
}