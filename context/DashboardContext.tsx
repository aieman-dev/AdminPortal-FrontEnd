// context/DashboardContext.tsx
"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import { settingService, type NotificationItem } from "@/services/setting-services"
import { dashboardService } from "@/services/dashboard-service"
import { type KioskStatus, type DashboardSummary } from "@/type/dashboard"
import { useAuth } from "@/hooks/use-auth"
import { logger } from "@/lib/logger"

interface DashboardContextType {
  // Alerts & Notifications (Init only)
  broadcasts: NotificationItem[]
  personalNotifications: any[]
  unreadCount: number
  
  // Kiosk Data (Refreshes every 30s)
  kioskData: KioskStatus[]
  isKioskRefreshing: boolean
  
  // Dashboard Summary (Init only)
  summary: DashboardSummary | null
  isLoading: boolean
  refreshAll: () => Promise<void>
  refreshKiosks: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  
  // State
  const [broadcasts, setBroadcasts] = useState<NotificationItem[]>([])
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [kioskData, setKioskData] = useState<KioskStatus[]>([])
  const [isKioskRefreshing, setIsKioskRefreshing] = useState(false)
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  // 1. Kiosk Refresh Logic (Periodic)
  const refreshKiosks = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsKioskRefreshing(true)
    try {
      const kiosks = await dashboardService.getKioskStatus()
      setKioskData(kiosks)
    } catch (error) {
      logger.error("Kiosk Poll Error", { error });
    } finally {
      setIsKioskRefreshing(false)
    }
  }, [isAuthenticated])


  // 2. Stats/Summary Refresh Logic (Slow Poll: 6 hours)
  const refreshStats = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const summaryData = await dashboardService.getSummary("ThisWeek");
      setSummary(summaryData);
    } catch (error) {
      logger.error("Stats Poll Error", { error });
    }
  }, [isAuthenticated]);


  // 3. Initial Data Load (Everything)
  const refreshAll = useCallback(async () => {
    if (!isAuthenticated) return
    setIsLoading(true)
    try {
      const [alerts, kiosks, summaryData] = await Promise.all([
        settingService.getDashboardAlerts(),
        dashboardService.getKioskStatus(),
        dashboardService.getSummary("ThisWeek")
      ])
      
      setBroadcasts(alerts.broadcasts || [])
      setPersonalNotifications(alerts.personalNotifications || [])
      setUnreadCount(alerts.unreadCount || 0)
      setKioskData(kiosks)
      setSummary(summaryData)
    } catch (error) {
        logger.error("Initial Load Error", { error });
    } finally {
      setIsLoading(false)
    }
  }, [isAuthenticated])


  // Effect A: Initial Load
  useEffect(() => {
    refreshAll()
  }, [refreshAll])


  // Effect B: Kiosk Polling (1 Minute)
  useEffect(() => {
    if (!isAuthenticated) return
    
    const intervalId = setInterval(() => {
      if (!document.hidden) {
        refreshKiosks()
      }
    }, 60000)

    return () => clearInterval(intervalId)
  }, [isAuthenticated, refreshKiosks])


  // Effect C: Stat Card Polling (6 Hours)
  useEffect(() => {
    if (!isAuthenticated) return

    // 6 hours * 60 min * 60 sec * 1000 ms = 21,600,000 ms
    const intervalId = setInterval(() => {
        if (!document.hidden) {
            refreshStats();
        }
    }, 21600000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, refreshStats]);


  // Effect D: Push unread count to the native PWA App Icon
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (unreadCount > 0) {
        navigator.setAppBadge(unreadCount).catch((error) => {
           logger.error("Failed to set app badge:", { error });
        });
      } else {
        if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge().catch((error) => {
                logger.error("Failed to clear app badge:", { error });
            } );
        }
      }
    }
  }, [unreadCount]);


  return (
    <DashboardContext.Provider value={{
      broadcasts, personalNotifications, unreadCount,
      kioskData, isKioskRefreshing,
      summary, isLoading,
      refreshAll, refreshKiosks
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export const useDashboard = () => {
  const context = useContext(DashboardContext)
  if (!context) throw new Error("useDashboard must be used within DashboardProvider")
  return context
}