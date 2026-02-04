"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Menu, ChevronRight, Bell } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { APP_VERSION } from "@/lib/constants"
import { NotificationPopover } from "@/components/portal/notification-popover"

interface HeaderProps {
  onMenuClick?: () => void
  onToggleCollapse?: () => void
  sidebarCollapsed?: boolean
  unreadCount?: number
  broadcasts?: any[]
  personal?: any[]
  onMarkAllRead?: () => void
}

export function Header({ 
  onMenuClick, 
  onToggleCollapse, 
  sidebarCollapsed, 
  unreadCount = 0,
  broadcasts = [],
  personal = [],
  onMarkAllRead
}: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-30 h-16 border-b bg-card flex items-center justify-between px-6">
      {/* LEFT SIDE: Hamburger & Title */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={onToggleCollapse}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
        <div className="flex flex-col justify-center min-w-0">
          <h2 className="text-sm md:text-lg font-semibold truncate">
            Welcome back, {user?.name?.split(" ")[0] || "User"}
          </h2>
          <p className="text-xs text-muted-foreground truncate hidden sm:block">
            Manage your workspace
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Notifications, Version, Theme Toggle */}
      <div className="flex items-center gap-2 md:gap-4">

        {/* NEW NOTIFICATION POPOVER */}
        <NotificationPopover 
            unreadCount={unreadCount} 
            broadcasts={broadcasts} 
            personal={personal}
            onMarkAllRead={onMarkAllRead} 
            // Optional: You can implement single read later
            onMarkAsRead={(id) => console.log("Mark single read", id)}
        />
        
        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

        {/* Version & Theme */}
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
          <ThemeToggle />
        </div>
      </div> 
    </header>
  )
}