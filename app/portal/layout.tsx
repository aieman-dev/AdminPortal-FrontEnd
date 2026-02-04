//app/portal/layout
"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Sidebar } from "@/components/portal/sidebar"
import { Header } from "@/components/portal/header"
import { ProtectedRoute } from "@/components/portal/protected-route"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { CommandMenu } from "@/components/portal/command-menu"
import { SessionTimer } from "@/components/portal/session-timer"
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { SystemAnnouncement } from "@/components/portal/system-annoucement";
import { SystemOffline } from "@/components/portal/system-offline";
import { SystemTips } from "@/components/portal/system-tips"
import { settingService, type BroadcastItem } from "@/services/setting-services";

import { AnimatePresence } from "framer-motion"
import { PageWrapper } from "@/components/portal/page-wrapper"
import { usePathname } from "next/navigation"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [lockDetails, setLockDetails] = useState<any>(null);

  // Broadcast noti
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSystemNews, setShowSystemNews] = useState(true);

  const fetchDashboardData = useCallback(async () => {
      try {
        const response: any = await settingService.getDashboardAlerts();
        if (!response) return
        
        const data = response.content || response;
        
        setBroadcasts((prev) => 
          JSON.stringify(prev) === JSON.stringify(data.broadcasts) ? prev : (data.broadcasts || [])
        )
            
        setPersonalNotifications((prev) => 
          JSON.stringify(prev) === JSON.stringify(data.personalNotifications) ? prev : (data.personalNotifications || [])
        )

        setUnreadCount((prev) => (prev === data.unreadCount ? prev : data.unreadCount))
        
      } catch (error) {
        console.error("Dashboard Poll Error:", error);
      }
  }, [])

  const handleMarkAllRead = async () => {
      try {
          await settingService.markAllNotificationsAsRead();
          
          setUnreadCount(0);
          setBroadcasts(prev => prev.map(b => ({ ...b, isRead: true })));
          setPersonalNotifications(prev => prev.map(p => ({ ...p, isRead: true })));

          await fetchDashboardData();  
      } catch (error) {
          console.error("Failed to mark all read:", error);
      }
  };

  useEffect(() => {
    const initPreferences = async () => {
      try {
        const prefData = await settingService.getSetting<boolean>("systemAnnouncements");
        setShowSystemNews(prefData ?? true);
      } catch (error) {
        console.error("Pref Load Error:", error);
      }
    };
    
    initPreferences();
    fetchDashboardData();

    // 1. Polling: Only fetch if the tab is visible
  const intervalId = setInterval(() => {
    if (!document.hidden) {
      fetchDashboardData();
    }
  }, 30000);

  // 2. Revalidation: Fetch immediately when user returns to the tab
  const handleVisibilityChange = () => {
    if (!document.hidden) {
      console.log("Tab active: Revalidating dashboard...");
      fetchDashboardData();
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Cleanup
  return () => {
    clearInterval(intervalId);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
  };
}, [fetchDashboardData]);


  useEffect(() => {
    const handleGlobalError = (event: Event) => {
        const customEvent = event as CustomEvent;
        // 1. Get message from event
        const msg = customEvent.detail?.message || "System Unavailable";
        const debug = customEvent.detail?.debugInfo;
        
        // 2. Set State
        setLockMessage(msg);
        setLockDetails(debug);
        setIsSystemLocked(true);
    };

    window.addEventListener("sys:global-error", handleGlobalError);
    window.addEventListener("sys:offline", handleGlobalError);
    
    return () => {
      window.removeEventListener("sys:global-error", handleGlobalError);
      window.removeEventListener("sys:offline", handleGlobalError);
    };
  }, []);

    useAutoLogout();

  if (isSystemLocked) {
    return (
        <div className="h-screen w-screen bg-background flex items-center justify-center p-4">
            <SystemOffline 
                message={lockMessage} 
                onRetry={() => window.location.reload()} 
                errorDetails={lockDetails}
            />
        </div>
    );
  }

  const visibleBroadcasts = showSystemNews 
    ? broadcasts 
    : broadcasts.filter(b => b.type === 'critical' || b.type === 'warning');

  return (
    <ProtectedRoute>
      <div className="h-screen flex overflow-hidden bg-background">
        {/* Mobile sidebar backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 lg:static lg:z-0 transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
          onMouseEnter={() => setSidebarCollapsed(false)}
          onMouseLeave={() => setSidebarCollapsed(true)}
        >
          <Sidebar collapsed={sidebarCollapsed} />
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            <div className="flex flex-col shrink-0 z-30">
              <SystemAnnouncement broadcasts={visibleBroadcasts} />
              <Header 
                  onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
                  unreadCount={unreadCount}
                  broadcasts={broadcasts}
                  personal={personalNotifications} 
                  onMarkAllRead={handleMarkAllRead}
                />
            </div>

            <CommandMenu />
            <SessionTimer/>
            <SystemTips />

          <main className="flex-1 overflow-y-auto bg-background overscroll-contain">
            <div className="container mx-auto p-4 md:p-6 pb-24">
              <AnimatePresence mode="wait">
                <PageWrapper key={pathname}>
                  {children}
                </PageWrapper>
              </AnimatePresence>
            </div>
          </main>
        </div>
      </div>

      <Toaster />
      
    </ProtectedRoute>
  )
}