// hooks/use-auto-logout.ts
"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth" // We use the direct logout function

// Default: 10 minutes (10 * 60 * 1000)
// For Testing: Change this to 10000 (10 seconds)
export function useAutoLogout(timeoutMs = 10 * 60 * 1000) {
  const router = useRouter()
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogout = useCallback(async () => {
    // 1. Clear any pending timers
    if (timerRef.current) clearTimeout(timerRef.current)
    
    console.log("Auto-logout triggered due to inactivity.")
    
    // 2. Perform Logout
    await logout()
    
    // 3. Force redirect (just in case logout() doesn't)
    router.push("/login")
  }, [router])

  useEffect(() => {
    // Function to reset the timer whenever user is active
    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      
      timerRef.current = setTimeout(() => {
        handleLogout()
      }, timeoutMs)
    }

    // Events that count as "Activity"
    const events = [
      "mousedown", 
      "mousemove", 
      "keydown", 
      "scroll", 
      "touchstart", 
      "click"
    ]
    
    // Attach Listeners
    // Use { passive: true } for better performance on scroll/touch
    events.forEach(event => 
      document.addEventListener(event, resetTimer, { passive: true })
    )
    
    // Initialize timer immediately on mount
    resetTimer()

    // Cleanup Listeners on Unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      events.forEach(event => 
        document.removeEventListener(event, resetTimer)
      )
    }
  }, [handleLogout, timeoutMs])
}