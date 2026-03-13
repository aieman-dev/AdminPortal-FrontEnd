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
  const currentY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const MAX_PULL = 100
  const THRESHOLD = 65

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull if we are exactly at the top of the scroll container
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      startY.current = e.touches[0].clientY
    } else {
      startY.current = 0
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY.current || isRefreshing) return

    currentY.current = e.touches[0].clientY
    const distance = currentY.current - startY.current

    if (distance > 0) {
      // Add "resistance" so it feels heavy like a native app
      setPullDistance(Math.min(distance * 0.4, MAX_PULL)) 
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > THRESHOLD && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(THRESHOLD) // Hold it open while spinning
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Didn't pull far enough, snap back
      setPullDistance(0)
    }
    startY.current = 0
    currentY.current = 0
  }

  return (
    <div 
      ref={containerRef}
      className="h-full w-full overflow-y-auto relative overscroll-y-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* The Spinning Icon hidden at the top */}
      <div 
        className="absolute top-0 left-0 right-0 flex justify-center items-center overflow-hidden transition-all duration-200 ease-out z-10"
        style={{ height: `${pullDistance}px`, opacity: pullDistance / THRESHOLD }}
      >
        <div 
            className={`p-2 rounded-full bg-white shadow-md border ${isRefreshing ? 'animate-spin' : ''}`} 
            style={{ transform: `rotate(${pullDistance * 3}deg)` }}
        >
          <RefreshCw className="h-5 w-5 text-indigo-600" />
        </div>
      </div>

      {/* Your Page Content */}
      <div 
        className="transition-transform duration-200 ease-out min-h-full"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  )
}