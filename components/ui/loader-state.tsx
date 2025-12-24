// components/ui/loader-state.tsx
"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderStateProps {
  message?: string
  className?: string
  iconClassName?: string
}

export function LoaderState({ 
  message = "Loading module...", 
  className,
  iconClassName 
}: LoaderStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-20 text-muted-foreground h-[400px] border rounded-lg bg-muted/10 animate-in fade-in duration-500", 
      className
    )}>
      <Loader2 className={cn("h-10 w-10 animate-spin mb-4 text-primary", iconClassName)} />
      <p className="font-medium text-sm">{message}</p>
    </div>
  )
}