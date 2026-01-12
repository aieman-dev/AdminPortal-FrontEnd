// components/portal/system-offline.tsx
"use client"

import { WifiOff, RotateCcw, Lock, AlertTriangle, Bug, Clock, ShieldAlert, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SystemDiagnostics } from "@/components/portal/system-diagnostics"
import { useAuth } from "@/hooks/use-auth"

interface SystemOfflineProps {
  onRetry?: () => void;
  message?: string;
}

export function SystemOffline({ onRetry, message = "Unknown Error" }: SystemOfflineProps) {
  const { logout } = useAuth();

  // Default: Network Error
  let icon = <WifiOff className="h-10 w-10 text-red-600" />;
  let title = "System Unavailable";
  let colorClass = "bg-red-50 border-red-100 text-red-600";
  let showDiagnostics = true;

  const lowerMsg = message.toLowerCase();

  // Scenario A: Account Expired (Matches the backend message "permissions have expired")
  if (lowerMsg.includes("expired")) {
      icon = <Clock className="h-10 w-10 text-orange-600" />;
      title = "Account Expired";
      colorClass = "bg-orange-50 border-orange-100 text-orange-600";
      showDiagnostics = false; // No need to ping server, this is a logic error
  }
  // Scenario B: Access Denied / 403
  else if (lowerMsg.includes("access denied") || lowerMsg.includes("unauthorized") || lowerMsg.includes("forbidden")) {
      icon = <ShieldAlert className="h-10 w-10 text-amber-600" />;
      title = "Access Restricted";
      colorClass = "bg-amber-50 border-amber-100 text-amber-600";
      showDiagnostics = false;
  }
  // Scenario C: Code Error
  else if (lowerMsg.includes("is not a function") || lowerMsg.includes("is undefined") || lowerMsg.includes("minified react error")) {
      icon = <Bug className="h-10 w-10 text-purple-600" />;
      title = "Application Error";
      colorClass = "bg-purple-50 border-purple-100 text-purple-600";
  }

  return (
    <div className="h-full w-full max-w-md flex flex-col items-center justify-center space-y-6 animate-in fade-in zoom-in-95 duration-300 mx-auto">
      
      {/* DYNAMIC ICON */}
      <div className="relative">
        <div className={`absolute inset-0 rounded-full scale-150 animate-pulse opacity-20 ${colorClass.split(" ")[0]}`} />
        <div className={`p-6 rounded-full border-2 relative z-10 ${colorClass}`}>
          {icon}
        </div>
      </div>

      {/* ERROR TEXT */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed max-w-[300px] mx-auto">
          {message}
        </p>
      </div>

      {/* -- DIAGNOSTICS (Only for connectivity issues) --- */}
      {showDiagnostics && (
          <div className="w-full">
             <SystemDiagnostics autoRun={true} />
          </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 w-full pt-2">
        <Button 
          variant="outline" 
          onClick={onRetry || (() => window.location.reload())}
          className="gap-2 w-full h-11"
        >
          <RotateCcw className="h-4 w-4" /> Try Again / Refresh
        </Button>

        {/* --- NEW: BACK TO LOGIN BUTTON --- */}
        <Button 
          variant="ghost" 
          onClick={() => logout()}
          className="gap-2 w-full h-11 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <LogOut className="h-4 w-4" /> Back to Login
        </Button>
        
        {/* Helper text specific for Expired Accounts */}
        {lowerMsg.includes("expired") && (
            <div className="text-xs text-center text-muted-foreground mt-2 bg-muted/50 p-3 rounded-lg border border-border/50">
                <p>Your access validity has ended.</p>
                <p>Please contact <strong>MIS SuperAdmin</strong> to extend your account.</p>
            </div>
        )}
      </div>
    </div>
  )
}