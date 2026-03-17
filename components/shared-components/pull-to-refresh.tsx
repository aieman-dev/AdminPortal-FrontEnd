// components/shared-components/pull-to-refresh.tsx
"use client"

import React, { useState, useRef, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const startY = useRef(0)
  const isPulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const MAX_PULL = 120
  const THRESHOLD = 70

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Find the actual scrollable parent (our <main> tag in portal/layout.tsx)
    const getScrollTop = () => {
       const parentScroll = container.closest('.overflow-y-auto, .overflow-auto');
       if (parentScroll) return parentScroll.scrollTop;
       return window.scrollY || document.documentElement.scrollTop;
    }

    const handleTouchStart = (e: TouchEvent) => {
      // Only initiate pull if we are at the absolute top of the page
      if (getScrollTop() <= 0) {
        startY.current = e.touches[0].clientY
        isPulling.current = true
      } else {
        isPulling.current = false
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current || isRefreshing) return

      const currentY = e.touches[0].clientY
      const distance = currentY - startY.current

      // If pulling downwards and we are at the top
      if (distance > 0 && getScrollTop() <= 0) {
        // CRITICAL: Prevent the browser's native pull-to-refresh!
        if (e.cancelable) e.preventDefault()
        
        // Apply heavy resistance for a native feel
        const pull = Math.min(distance * 0.4, MAX_PULL)
        setPullDistance(pull)
      } else {
        // If they scroll back up, cancel the pull
        setPullDistance(0)
      }
    }

    const handleTouchEnd = async () => {
      if (!isPulling.current) return
      isPulling.current = false

      if (pullDistance >= THRESHOLD && !isRefreshing) {
        setIsRefreshing(true)
        setPullDistance(THRESHOLD) // Lock it at the threshold while spinning
        
        try {
          await onRefresh()
        } finally {
          setIsRefreshing(false)
          setPullDistance(0) // Snap back up
        }
      } else {
        // Didn't pull far enough, snap back immediately
        setPullDistance(0)
      }
    }

    // Attach Native Event Listeners
    // { passive: false } is REQUIRED on touchmove so we can use e.preventDefault()
    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false }) 
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [isRefreshing, pullDistance, onRefresh])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-screen">
      
      {/* The Spinning Indicator */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-end overflow-hidden transition-all duration-200 ease-out z-20 pointer-events-none"
        style={{ height: `${pullDistance}px`, opacity: pullDistance / THRESHOLD }}
      >
        <div 
            className={`mb-4 p-2 rounded-full bg-card shadow-md border border-border ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
        >
          <RefreshCw className="h-5 w-5 text-primary" />
        </div>
      </div>

      {/* The Page Content */}
      <div 
        className="transition-transform duration-200 ease-out h-full"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
      
    </div>
  )
}