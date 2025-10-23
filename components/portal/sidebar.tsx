"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Building2, LayoutDashboard, FileText, LogOut, ChevronLeft, ChevronDown, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useState } from "react"

const navigation = [
  {
    name: "Dashboard",
    href: "/portal",
    icon: LayoutDashboard,
  },
  {
    name: "Page 1",
    href: "/portal/page-1",
    icon: FileText,
  },
  {
    name: "IT POSWF",
    icon: Wallet,
    children: [
      {
        name: "Search History Record",
        href: "/portal/it-poswf/search-history",
      },
      {
        name: "Search Shopify Order",
        href: "/portal/it-poswf/search-shopify-order",
      },
      {
        name: "Ticket Management",
        href: "/portal/it-poswf/ticket-management",
      },
      {
        name: "Account Management",
        href: "/portal/it-poswf/account-management",
      },
    ],
  },
  {
    name: "Page 3",
    href: "/portal/page-3",
    icon: FileText,
  },
  {
    name: "Page 4",
    href: "/portal/page-4",
    icon: FileText,
  },
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(["IT POSWF"])

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  return (
    <div
      className={cn("flex h-full flex-col border-r bg-card transition-all duration-300", collapsed ? "w-16" : "w-64")}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4 justify-between">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Theme Park Portal</span>
          </div>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <Button variant="ghost" size="icon" className="hidden lg:flex h-8 w-8" onClick={onToggleCollapse}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navigation.map((item) => {
          if (item.children) {
            const isOpen = openDropdowns.includes(item.name)
            const isAnyChildActive = item.children.some((child) => pathname === child.href)

            return (
              <div key={item.name}>
                <button
                  onClick={() => !collapsed && toggleDropdown(item.name)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isAnyChildActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                    collapsed && "justify-center",
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.name}</span>
                      <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                    </>
                  )}
                </button>
                {!collapsed && isOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l pl-4">
                    {item.children.map((child) => {
                      const isActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                collapsed && "justify-center",
              )}
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User Profile & Logout */}
      <div className="border-t p-4 space-y-3">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">{user?.name?.charAt(0) || "U"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.role || "Role"}</p>
              </div>
            </div>
            <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </>
        ) : (
          <>
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{user?.name?.charAt(0) || "U"}</span>
              </div>
            </div>
            <Button variant="outline" size="icon" className="w-full bg-transparent" onClick={logout} title="Sign out">
              <LogOut className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
