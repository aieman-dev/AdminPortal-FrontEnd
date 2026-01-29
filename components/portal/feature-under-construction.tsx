"use client"

import { Construction, Clock, ArrowLeft, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"

interface FeatureUnderConstructionProps {
  title?: string
  description?: string
  badgeText?: string
  showBackButton?: boolean
}

export function FeatureUnderConstruction({
  title = "Feature In Progress",
  description = "We are currently working on the logic and API integration for this module. It will be available in an upcoming update.",
  badgeText = "Coming Soon",
  showBackButton = false
}: FeatureUnderConstructionProps) {
  const router = useRouter()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative mb-6 group">
        <div className="absolute inset-0 bg-indigo-100 dark:bg-indigo-900/20 rounded-full scale-150 opacity-20 animate-pulse" />
        <div className="relative h-24 w-24 bg-white dark:bg-zinc-900 rounded-full border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-center shadow-sm group-hover:border-indigo-400 transition-colors">
          <Rocket className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
          {badgeText}
        </div>
      </div>

      <div className="text-center max-w-md space-y-3">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>

      {showBackButton && (
        <Button 
          variant="outline" 
          className="mt-8 gap-2"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" /> Go Back
        </Button>
      )}
      
      {/* Optional Technical Note for Seniors/Devs */}
      <div className="mt-12 p-3 bg-muted/30 rounded-lg border border-border/50 text-xs text-muted-foreground font-mono flex items-center gap-2">
        <Construction className="h-3 w-3" />
        <span>Status: Pending Backend API Implementation</span>
      </div>
    </div>
  )
}