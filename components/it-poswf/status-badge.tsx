import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: string
  variant?: "default" | "secondary" | "destructive" | "outline"
  colorMap?: Record<string, string>
}

export function StatusBadge({ status, variant, colorMap }: StatusBadgeProps) {
  const defaultColorMap: Record<string, string> = {
    paid: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20",
    failed: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
    credit: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    debit: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
    purchase: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
    refund: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
    consume: "bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20",
  }

  const safeStatus = status ?? "N/A"
  const colors = colorMap || defaultColorMap
  const statusLower = safeStatus.toLowerCase()
  const colorClass = colors[statusLower] || "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20"

  return (
    <Badge variant={variant || "secondary"} className={colorClass}>
      {safeStatus}
    </Badge>
  )
}
