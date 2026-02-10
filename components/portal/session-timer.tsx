"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { LogOut, Power, Timer } from "lucide-react"
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useAppToast } from "@/hooks/use-app-toast"
import { cn } from "@/lib/utils"

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

  // --- HELPER: Format Seconds to MM m : SS s ---
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m} m : ${s} s`;
  };

  // --- LOGIC (Same as before) ---
  const handleTimeout = useCallback(() => {
    setIsWarning(false)
    logout()
    router.push("/login?error=session_expired")
  }, [logout, router])

  const updateActivity = useCallback(() => {
    if (!isWarning) {
      lastActivity.current = Date.now()
    }
  }, [isWarning])

  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivity.current
      const timeRemaining = TIMEOUT_MS - timeSinceLastActivity

      console.log(`[Timer Debug] Idle for: ${(timeSinceLastActivity/1000).toFixed(0)}s | Time Left: ${(timeRemaining/1000).toFixed(0)}s | Warning at: ${(WARNING_MS/1000)}s`);

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
    events.forEach(event => window.addEventListener(event, updateActivity))
    return () => events.forEach(event => window.removeEventListener(event, updateActivity))
  }, [updateActivity])

  const handleExtend = async () => {
    setIsExtending(true)
    try {
      await fetch("/api/auth/refresh", { method: "POST" })
      lastActivity.current = Date.now()
      setIsWarning(false)
      toast.success("Welcome Back", "Session resumed successfully.")
    } catch (err) {
      lastActivity.current = Date.now()
      setIsWarning(false)
    } finally {
      setIsExtending(false)
    }
  }

  if (!isWarning) return null

  // Calculate percentage for progress bar (0 to 100)
  const progressPercent = (timeLeft / (WARNING_MS / 1000)) * 100;

  return (
    <Dialog open={isWarning} onOpenChange={(open) => !open && handleTimeout()}> 
      <DialogContent className="sm:max-w-[380px] p-0 overflow-hidden border-0 shadow-2xl" onPointerDownOutside={(e) => e.preventDefault()}>
        
        {/* HEADER BACKGROUND */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-white text-center relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid-pattern.svg')] opacity-10" />
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            
            <div className="relative z-10 flex flex-col items-center">
                <div className="h-12 w-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-3 ring-1 ring-white/30">
                    <Timer className="h-6 w-6 text-white" />
                </div>
                <DialogTitle className="text-xl font-bold tracking-tight text-white">Session Timeout</DialogTitle>
                <p className="text-indigo-100 text-xs mt-1">Due to inactivity, your session is ending.</p>
            </div>
        </div>

        {/* TIMER BODY */}
        <div className="p-6 flex flex-col items-center bg-background">
            <div className="text-center mb-6 w-full">
                <p className="text-sm text-muted-foreground mb-2 uppercase tracking-wider font-bold text-[10px]">Auto Logout In</p>
                
                {/* BIG TIMER */}
                <div className="text-4xl font-mono font-bold text-foreground tabular-nums tracking-tight">
                    {formatTime(timeLeft)}
                </div>

                {/* PROGRESS BAR */}
                <div className="w-full h-1.5 bg-muted rounded-full mt-4 overflow-hidden">
                    <div 
                        className={cn(
                            "h-full transition-all duration-1000 ease-linear",
                            timeLeft < 30 ? "bg-red-500" : "bg-indigo-500"
                        )}
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            <DialogFooter className="flex-row gap-3 w-full sm:justify-between">
                <Button 
                    variant="outline" 
                    onClick={handleTimeout} 
                    className="flex-1 h-11 border-dashed border-gray-300 hover:border-red-300 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                </Button>
                <Button 
                    onClick={handleExtend} 
                    disabled={isExtending} 
                    className="flex-[2] h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                >
                    {isExtending ? "Resuming..." : (
                        <>
                            <Power className="h-4 w-4 mr-2" /> Keep Working
                        </>
                    )}
                </Button>
            </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}