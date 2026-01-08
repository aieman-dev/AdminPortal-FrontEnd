"use client"

import { WifiOff, RotateCcw, Lock, AlertTriangle, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SystemDiagnostics } from "@/components/portal/system-diagnostics"

interface SystemOfflineProps {
  onRetry?: () => void;
  message?: string;
}

export function SystemOffline({ onRetry, message = "Unknown Error" }: SystemOfflineProps) {

  // --- 1. DYNAMIC LOGIC ---
  let icon = <WifiOff className="h-10 w-10 text-red-600" />;
  let title = "System Unavailable";
  let colorClass = "bg-red-50 border-red-100 text-red-600";

  const lowerMsg = message.toLowerCase();

  // Scenario A: Permissions / Auth
  if (lowerMsg.includes("access denied") || lowerMsg.includes("unauthorized") || lowerMsg.includes("expired")) {
      icon = <Lock className="h-10 w-10 text-amber-600" />;
      title = "Access Restricted";
      colorClass = "bg-amber-50 border-amber-100 text-amber-600";
  }
  // Scenario B: Application Bug (Code Error)
  else if (lowerMsg.includes("is not a function") || lowerMsg.includes("is undefined") || lowerMsg.includes("render")) {
      icon = <Bug className="h-10 w-10 text-purple-600" />;
      title = "Application Error";
      colorClass = "bg-purple-50 border-purple-100 text-purple-600";
  }
  // Scenario C: Network / Server (Default)
  else {
      // Default to "Wifi Off" for connection issues
  }
  return (
    <div className="h-[calc(100vh-100px)] flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* DYNAMIC ICON */}
      <div className="relative">
        <div className={`absolute inset-0 rounded-full scale-150 animate-pulse opacity-20 ${colorClass.split(" ")[0]}`} />
        <div className={`p-6 rounded-full border-2 relative z-10 ${colorClass}`}>
          {icon}
        </div>
      </div>

      {/* ERROR TEXT */}
      <div className="text-center max-w-md space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm max-h-[100px] overflow-y-auto">
          {message}
        </p>
      </div>

      {/* --INTEGRATED DIAGNOSTICS --- */}
      <div className="w-full">
         <SystemDiagnostics autoRun={true} />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 pt-2 w-full">
        <Button 
          variant="outline" 
          onClick={onRetry || (() => window.location.reload())}
          className="gap-2 w-full h-11"
        >
          <RotateCcw className="h-4 w-4" /> Try Again
        </Button>
      </div>
      
      {/* Tech Detail */}
      <div className="text-xs font-mono text-muted-foreground bg-muted py-1 px-3 rounded">
        Error: 503 Service Unavailable / Connection Refused
      </div>
    </div>
  )
}