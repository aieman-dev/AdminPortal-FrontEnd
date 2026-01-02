"use client"

import { WifiOff, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SystemOfflineProps {
  onRetry?: () => void;
  message?: string;
}

export function SystemOffline({ onRetry, message }: SystemOfflineProps) {
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
      {/* Visual Indicator */}
      <div className="relative">
        <div className="absolute inset-0 bg-red-100 rounded-full scale-150 animate-pulse opacity-50" />
        <div className="bg-red-50 p-6 rounded-full border-2 border-red-100 relative z-10">
          <WifiOff className="h-10 w-10 text-red-600" />
        </div>
      </div>

      {/* Text Content */}
      <div className="text-center max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">System Unavailable</h2>
        <p className="text-gray-500 dark:text-gray-400">
          {message || "Unable to connect to the backend server. The system may be offline for maintenance or experiencing connectivity issues."}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="outline" 
          onClick={onRetry || (() => window.location.reload())}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" /> Retry Connection
        </Button>
      </div>
      
      {/* Tech Detail */}
      <div className="text-xs font-mono text-muted-foreground bg-muted py-1 px-3 rounded">
        Error: 503 Service Unavailable / Connection Refused
      </div>
    </div>
  )
}