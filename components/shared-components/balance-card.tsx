import { Card, CardContent } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { formatCurrency } from "@/lib/formatter";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  title: string
  amount: number
  description: string
  icon: LucideIcon
  valueColor?: string
  className?: string
}

export function BalanceCard({
  title,
  amount,
  description,
  icon: Icon,
  valueColor = "text-foreground",
  className
}: BalanceCardProps) {
  return (
    <Card className={cn("h-full flex flex-col justify-center", className)}>
      <CardContent className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium">{title}</div>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className={`text-2xl font-bold ${valueColor}`}>{formatCurrency(amount)}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
