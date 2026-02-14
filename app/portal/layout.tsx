//app/portal/layout
"use client"

import React, { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence } from "framer-motion"

// Components
import { Sidebar } from "@/components/portal/sidebar"
import { Header } from "@/components/portal/header"
import { ProtectedRoute } from "@/components/portal/protected-route"
import { Toaster } from "@/components/ui/toaster"
import { CommandMenu } from "@/components/portal/command-menu"
import { SessionTimer } from "@/components/portal/session-timer"
import { SystemAnnouncement } from "@/components/portal/system-annoucement"
import { SystemOffline } from "@/components/portal/system-offline"
import { SystemTips } from "@/components/portal/system-tips"
import { PageWrapper } from "@/components/portal/page-wrapper"
import { cn } from "@/lib/utils"

// Context & Services
import { DashboardProvider, useDashboard } from "@/context/DashboardContext"
import { settingService } from "@/services/setting-services"


export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardProvider>
        <PortalContent>{children}</PortalContent>
      </DashboardProvider>
    </ProtectedRoute>
  )
}

  function PortalContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const [isSystemLocked, setIsSystemLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");
  const [lockDetails, setLockDetails] = useState<any>(null);

  // Broadcast noti
  const { broadcasts, personalNotifications, unreadCount, refreshAll } = useDashboard()
  const [showSystemNews, setShowSystemNews] = useState(true);


  // Simple Mark-Read Handler (UI Logic only)
  const handleMarkAllRead = async () => {
      try {
          await settingService.markAllNotificationsAsRead();
          refreshAll(); // Ask context to update data
      } catch (error) {
          console.error("Failed to mark all read:", error);
      }
  };

  // Load Preferences (UI Preference only)
  useEffect(() => {
    const loadPref = async () => {
      const prefData = await settingService.getSetting<boolean>("systemAnnouncements");
      setShowSystemNews(prefData ?? true);
    };
    loadPref();
  }, []);

    
  // Global Error Listener (Keep this here as it affects the whole UI)
  useEffect(() => {
    const handleGlobalError = (event: Event) => {
        const customEvent = event as CustomEvent;
        setLockMessage(customEvent.detail?.message || "System Unavailable");
        setLockDetails(customEvent.detail?.debugInfo);
        setIsSystemLocked(true);
    };

    window.addEventListener("sys:global-error", handleGlobalError);
    window.addEventListener("sys:offline", handleGlobalError);
    
    return () => {
      window.removeEventListener("sys:global-error", handleGlobalError);
      window.removeEventListener("sys:offline", handleGlobalError);
    };
  }, []);


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