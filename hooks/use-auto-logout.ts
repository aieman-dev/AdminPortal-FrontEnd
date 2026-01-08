// hooks/use-auto-logout.ts
"use client"

import { useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { logout } from "@/lib/auth" // We use the direct logout function

// Default: 10 minutes (10 * 60 * 1000)
// For Testing: Change this to 10000 (10 seconds)
export function useAutoLogout(timeoutMs = 10 * 60 * 1000) {
  const router = useRouter()
  const lastActivity = useRef(Date.now())
  

  const checkActivity = useCallback(() => {
    const now = Date.now()
    // Check if time elapsed since last activity > limit
    if (now - lastActivity.current > timeoutMs) {
      console.log("Auto-logout triggered: Session timed out.");
      logout() 
      router.push("/login")
    }
  }, [timeoutMs, router])

  useEffect(() => {
    // Function to reset the timer whenever user is active
    const updateActivity = () => {
      lastActivity.current = Date.now()
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
      document.addEventListener(event, updateActivity, { passive: true })
    )
    
    // 2. Interval Check
    // We check every 10 seconds. If the user tabs out for 20 mins,
    // the NEXT check (when the tab wakes up or the interval fires) will catch it immediately.
    const intervalId = setInterval(checkActivity, 10000)

    // Cleanup Listeners on Unmount
    return () => {
      events.forEach(e => document.removeEventListener(e, updateActivity))
      clearInterval(intervalId)
    }
  }, [checkActivity])
}