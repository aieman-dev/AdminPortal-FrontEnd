//app/portal/layout
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Sidebar } from "@/components/portal/sidebar"
import { Header } from "@/components/portal/header"
import { ProtectedRoute } from "@/components/portal/protected-route"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"
import { CommandMenu } from "@/components/portal/command-menu"
import { useAutoLogout } from "@/hooks/use-auto-logout";
import { SystemAnnouncement } from "@/components/portal/system-annoucement";
import { SystemOffline } from "@/components/portal/system-offline";
import { settingService, type BroadcastItem } from "@/services/setting-services";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

  const [isSystemOffline, setIsSystemOffline] = useState(false);

  // Broadcast noti
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [personalNotifications, setPersonalNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showSystemNews, setShowSystemNews] = useState(true);

  const fetchDashboardData = async () => {
      try {
        const response: any = await settingService.getDashboardAlerts();
        
        if (response) {
            const data = response.content || response;
            
            if (data.broadcasts) {
                const sortedBroadcasts = [...data.broadcasts].sort((a: any, b: any) => 
                    new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime()
                );
                setBroadcasts(sortedBroadcasts);
            }
            if (data.personalNotifications) setPersonalNotifications(data.personalNotifications);
            if (typeof data.unreadCount === 'number') setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Dashboard Poll Error:", error);
      }
  };

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

    const intervalId = setInterval(fetchDashboardData, 30000); 
    return () => clearInterval(intervalId);
  }, []);

  useAutoLogout();

  useEffect(() => {
    const handleOfflineTrigger = () => setIsSystemOffline(true);
    window.addEventListener("sys:offline", handleOfflineTrigger);
    return () => {
      window.removeEventListener("sys:offline", handleOfflineTrigger);
    };
  }, []);
  
  if (isSystemOffline) {
    return (
        <div className="h-screen w-screen bg-background flex items-center justify-center">
            <SystemOffline onRetry={() => window.location.reload()} />
        </div>
    );
  }

  const visibleBroadcasts = showSystemNews 
    ? broadcasts 
    : broadcasts.filter(b => b.type === 'critical' || b.type === 'warning');

  return (
    <ProtectedRoute>
      <div className="h-screen flex overflow-hidden">
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
        <div className="flex-1 flex flex-col overflow-hidden">
          <SystemAnnouncement broadcasts={visibleBroadcasts} />
          <Header 
            onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
            unreadCount={unreadCount}
            broadcasts={broadcasts}
            personal={personalNotifications} 
            onMarkAllRead={handleMarkAllRead}
          />
            <CommandMenu />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>

      <Toaster />
      
    </ProtectedRoute>
  )
}