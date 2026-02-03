"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Clock, AlertTriangle, LogOut, RefreshCw } from "lucide-react"
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useAppToast } from "@/hooks/use-app-toast"

// Helper to get cookie value by name
const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
}

export function SessionTimer() {
  const router = useRouter()
  const toast = useAppToast()
  const { logout } = useAuth()
  
  const [isOpen, setIsOpen] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  const checkSession = useCallback(() => {
    const token = getCookie("accessToken")
    if (!token) return

    try {
      // Decode JWT payload (standard Base64)
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expiry = payload.exp * 1000 // Convert to milliseconds
      const now = Date.now()
      const diff = expiry - now

      // Trigger warning if less than 2 minutes (120000ms) left
      if (diff > 0 && diff < 120000) {
        setTimeLeft(Math.floor(diff / 1000))
        setIsOpen(true)
      } else if (diff <= 0) {
        // Immediate logout if already expired
        handleExpired()
      } else {
        setIsOpen(false)
      }
    } catch (e) {
      console.error("Session check error", e)
    }
  }, [])

  const handleExpired = useCallback(() => {
    setIsOpen(false)
    logout()
    router.push("/login?error=session_expired")
  }, [logout, router])

  const handleExtend = async () => {
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" })
      if (res.ok) {
        setIsOpen(false)
        toast.success("Session Extended", "Your workspace is now active.")
      } else {
        handleExpired()
      }
    } catch (err) {
      handleExpired()
    }
  }

  useEffect(() => {
    const timer = setInterval(checkSession, 10000) // Check every 10 seconds
    return () => clearInterval(timer)
  }, [checkSession])

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" /> Session Expiring
          </DialogTitle>
          <DialogDescription>
            Your administrative session will end in <span className="font-bold text-foreground">{timeLeft} seconds</span>. 
            Would you like to extend your session?
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg flex gap-3 border border-orange-100 dark:border-orange-800">
            <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0" />
            <p className="text-xs text-orange-800 dark:text-orange-200">
                Unsaved changes in open forms may be lost if the session expires.
            </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="ghost" onClick={handleExpired} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
          <Button onClick={handleExtend} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
            <RefreshCw className="h-4 w-4" /> Keep Working
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}