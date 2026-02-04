// components/portal/system-offline.tsx
"use client"

import { WifiOff, RotateCcw, Bug, Clock, ShieldAlert, LogOut, Activity, Terminal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SystemDiagnostics } from "@/components/portal/system-diagnostics"
import { useAuth } from "@/hooks/use-auth"
import { cn } from "@/lib/utils"

interface SystemOfflineProps {
  onRetry?: () => void;
  message?: string;
  errorDetails?: any;
}

export function SystemOffline({ onRetry, message = "Unknown Error", errorDetails }: SystemOfflineProps) {
  const { logout } = useAuth(); //

  const lowerMsg = message.toLowerCase();
  const isExpired = lowerMsg.includes("expired");
  const isSecurity = lowerMsg.includes("access denied") || lowerMsg.includes("unauthorized") || lowerMsg.includes("forbidden");
  const isCodeError = lowerMsg.includes("hook") || lowerMsg.includes("is not a function") || lowerMsg.includes("undefined");

  let statusConfig = {
    icon: <WifiOff className="h-8 w-8 text-red-600" />,
    title: "System Connection Lost",
    themeColor: "bg-red-500",
    showDiagnostics: true
  };

  if (isExpired) {
    statusConfig = { icon: <Clock className="h-8 w-8 text-orange-600" />, title: "Session Expired", themeColor: "bg-orange-500", showDiagnostics: false };
  } else if (isSecurity) {
    statusConfig = { icon: <ShieldAlert className="h-8 w-8 text-amber-600" />, title: "Access Restricted", themeColor: "bg-amber-500", showDiagnostics: false };
  } else if (isCodeError) {
    statusConfig = { icon: <Bug className="h-8 w-8 text-purple-600" />, title: "Runtime Exception", themeColor: "bg-purple-500", showDiagnostics: true };
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/50 backdrop-blur-sm p-12 overflow-hidden touch-none animate-in fade-in duration-500">
      
      {/* Container with shadow  */}
      <div className="w-full max-w-5xl bg-card border border-border/60 shadow-[0_20px_50px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] rounded-3xl overflow-hidden flex flex-col md:flex-row h-fit max-h-full">
        
        {/* LEFT PANEL: Error Summary */}
        <div className="p-8 md:p-12 md:w-1/2 flex flex-col justify-between border-b md:border-b-0 md:border-r border-border/40 bg-background/50">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className={cn("p-4 rounded-2xl", statusConfig.themeColor.replace("bg-", "bg-opacity-10 text-"))}>
                {statusConfig.icon}
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">{statusConfig.title}</h2>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest pl-1">
                <Terminal size={14} />
                <span>Developer Metadata</span>
              </div>
              <div className="relative group">
                {/* Internal scroll allowed for very long errors, but main page is locked */}
                <pre className="p-5 bg-zinc-950 dark:bg-black rounded-2xl text-sm font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap break-words border border-white/5 shadow-inner max-h-[400px] overflow-y-auto scrollbar-hide">
                  {message}
                </pre>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={onRetry || (() => window.location.reload())}
              className="h-12 flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refresh Module
            </Button>
            <Button 
              variant="outline" 
              onClick={() => logout()} //
              className="h-12 flex-1 rounded-xl border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all active:scale-95"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* RIGHT PANEL: Status & Help */}
        <div className="p-8 md:p-12 md:w-1/2 bg-muted/20 flex flex-col justify-between">
          {statusConfig.showDiagnostics ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between pl-1">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                   <Activity size={16} className="text-indigo-500" />
                   System Integrity Check
                </h3>
              </div>
              <SystemDiagnostics autoRun={false} errorDetails={errorDetails} className="bg-transparent border-0 shadow-none p-0" />
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
              <div className="h-20 w-20 bg-background rounded-full flex items-center justify-center shadow-sm">
                <ShieldAlert size={32} className="text-muted-foreground/40" />
              </div>
              <div className="space-y-2 max-w-[280px]">
                <p className="font-bold text-foreground">Access Interrupted</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Please reach out to the MIS Superadmin if you believe this is an error.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border/40 text-[10px] text-muted-foreground flex justify-between items-center font-mono opacity-60">
            <span>MODULE_ID: 19C1D2D9CBE</span>
            <span>REF: {new Date().getTime().toString(16).toUpperCase()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}