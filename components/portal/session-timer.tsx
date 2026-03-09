"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Play, Clock, AlertCircle, Timer, Loader2 } from "lucide-react"
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useAppToast } from "@/hooks/use-app-toast"
import throttle from "lodash/throttle"
import { formatTime } from "@/lib/formatter"
import { Progress } from "@/components/ui/progress"
import { logger } from "@/lib/logger"

// --- CONFIGURATION ---
const TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes Total
const WARNING_MS = 2 * 60 * 1000;  // 2 Minutes Warning
// ---------------------

export function SessionTimer() {
  const router = useRouter()
  const toast = useAppToast()
  const { logout } = useAuth()
  
  const [isWarning, setIsWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(0)
  const [isExtending, setIsExtending] = useState(false)
  
  const lastActivity = useRef<number>(Date.now())
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const isWarningRef = useRef(isWarning);

  useEffect(() => {
      isWarningRef.current = isWarning;
  }, [isWarning]);

  // --- LOGIC (Same as before) ---
  const handleTimeout = useCallback(() => {
    setIsWarning(false)
    logout()
    router.push("/login?error=session_expired")
  }, [logout, router])


  const updateActivity = useCallback(
    throttle(() => {
      if (!isWarningRef.current) {
        lastActivity.current = Date.now()
      }
    }, 1000), 
    []
  )


  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity.current
      const timeRemaining = TIMEOUT_MS - timeSinceLastActivity

      logger.debug("Session Timer Tick", { idle: timeSinceLastActivity, timeLeft: timeRemaining  })

      if (timeRemaining <= 0) {
        handleTimeout()
      } else if (timeRemaining <= WARNING_MS) {
        if (!isWarning) setIsWarning(true)
        setTimeLeft(Math.floor(timeRemaining / 1000))
      } else {
        if (isWarning) setIsWarning(false)
      }
    }, 1000)

    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [isWarning, handleTimeout])

  useEffect(() => {
    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"]
    events.forEach(event => window.addEventListener(event, updateActivity, { passive: true }))
    
    return () => {
        events.forEach(event => window.removeEventListener(event, updateActivity))
    }
  }, [updateActivity])

  
  const handleExtend = async () => {
    setIsExtending(true)
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })
      
      if (!res.ok) {
          throw new Error("Refresh failed");
      }

      lastActivity.current = Date.now()
      setIsWarning(false)
      toast.success("Session Extended", "You can continue working.")
    } catch (err) {
      logger.error("Session extend failed:", err);
      // Optional: Force logout if refresh fails? 
      // handleTimeout(); 
    } finally {
      setIsExtending(false)
    }
  }

  if (!isWarning) return null

  // Calculate inverse percentage (100% -> 0%)
  const totalSeconds = WARNING_MS / 1000;
  const progressValue = (timeLeft / totalSeconds) * 100;

  return (
    <Dialog open={isWarning} onOpenChange={(open) => !open && handleTimeout()}> 
      <DialogContent className="sm:max-w-[400px] border shadow-2xl p-0 gap-0 overflow-hidden" onPointerDownOutside={(e) => e.preventDefault()}>
        
        {/* HEADER: Clean System Look */}
        <div className="p-6 pb-4 flex flex-col items-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Clock className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
                <DialogTitle className="text-xl">Session Expiring</DialogTitle>
                <p className="text-sm text-muted-foreground">
                    For your security, your session will time out due to inactivity.
                </p>
            </div>
        </div>

        {/* TIMER BODY */}
        <div className="px-6 pb-6 space-y-6">
            <div className="bg-muted/50 rounded-xl p-4 border flex flex-col items-center justify-center space-y-2">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Auto-Logout In</span>
                <span className="text-3xl font-mono font-bold tabular-nums tracking-tight text-foreground">
                    {formatTime(timeLeft)}
                </span>
                <Progress value={progressValue} className="h-2 w-32 mt-2" />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between w-full">
                <Button 
                    variant="ghost" 
                    onClick={handleTimeout} 
                    className="w-full sm:w-auto text-muted-foreground hover:text-red-600 hover:bg-red-50"
                >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
                <Button 
                    onClick={handleExtend} 
                    disabled={isExtending} 
                    className="w-full sm:w-auto bg-primary text-primary-foreground min-w-[140px]"
                >
                    {isExtending ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resuming...
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4 mr-2 fill-current" /> Keep Working
                        </>
                    )}
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}