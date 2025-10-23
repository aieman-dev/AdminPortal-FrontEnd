"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Menu, ChevronRight } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"
import { APP_VERSION } from "@/lib/constants"

interface HeaderProps {
  onMenuClick?: () => void
  onToggleCollapse?: () => void
  sidebarCollapsed?: boolean
}

export function Header({ onMenuClick, onToggleCollapse, sidebarCollapsed }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="h-16 border-b bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        {sidebarCollapsed && (
          <Button variant="ghost" size="icon" className="hidden lg:flex" onClick={onToggleCollapse}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h2 className="text-lg font-semibold">Welcome back, {user?.name?.split(" ")[0] || "User"}</h2>
          <p className="text-sm text-muted-foreground">Manage your workspace and projects</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">v{APP_VERSION}</span>
        <ThemeToggle />
      </div>
    </header>
  )
}
