"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Ticket, LogOut, ChevronDown, ServerCog, Users, Settings } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useState, useEffect } from "react" 
import { canViewITPOSWF } from "@/lib/auth" 

const navigation = [
  {
    name: "Dashboard",
    href: "/portal",
    icon: LayoutDashboard,
  },
  {
    name: "Package Management",
    href: "/portal/packages",
    icon: Ticket,
  },
  {
    name: "Themepark Support",
    icon: ServerCog,
    children: [
      {
        name: "Transaction Master",
        href: "/portal/themepark-support/transaction-master",
      },
      {
        name: "Attraction Master",
        href: "/portal/themepark-support/attraction-master",
      },
      {
        name: "Ticket Management",
        href: "/portal/themepark-support/ticket-master",
      },
      {
        name: "Account Management",
        href: "/portal/themepark-support/account-master",
      },
    ],
  },
  {
    name: "Users",
    href: "/portal/staff-management",
    icon: Users,
  },
  {
    name: "Settings",
    href: "/portal/page-4",
    icon: Settings,
  },
]

interface SidebarProps {
  collapsed?: boolean
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const { resolvedTheme } = useTheme()
  
  // FIX 1: Start with an empty array (closed by default)
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]) 
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  
  // FIX 2: Automatically open the dropdown ONLY if the current URL belongs to it
  useEffect(() => {
    // Check if the current path matches any child of the dropdowns
    const activeItem = navigation.find(item => 
      item.children && item.children.some(child => pathname.startsWith(child.href))
    )

    if (activeItem) {
      setOpenDropdowns(prev => {
        // Only add if not already open
        if (!prev.includes(activeItem.name)) {
          return [...prev, activeItem.name]
        }
        return prev
      })
    }
  }, [pathname]) // Re-run whenever the URL changes

  const isDarkMode = mounted && resolvedTheme === "dark"

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  const itemBaseClass = (isActive: boolean) => cn(
    "group flex items-center w-full rounded-lg py-3 transition-all duration-300 ease-in-out",
    isActive 
      ? "bg-primary text-primary-foreground" 
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    collapsed ? "justify-center px-0" : "justify-start px-3"
  )

  const filteredNavigation = navigation.filter((item) => {
    if (item.name === "IT POSWF") {
      return canViewITPOSWF(user?.department); 
    }
    return true;
  });

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card transition-[width] duration-300 ease-in-out overflow-hidden z-50 shadow-xl",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo Section */}
      <div className={cn(
        "flex h-16 items-center justify-center border-b py-6 transition-all duration-300 flex-shrink-0",
        isDarkMode ? "border-gray-700" : "border-gray-200"
      )}>
        <div
          className={cn(
            "relative h-[51px] transition-all duration-300 ease-in-out overflow-hidden",
            collapsed ? "w-[60px]" : "w-[145px]"
          )}
        >
          {mounted && (
            <Image
              src={isDarkMode ? "/logo/icity-logo-white.svg" : "/logo/icity-logo.svg"}
              alt="I-City Logo"
              fill
              priority
              className="object-contain transition-all duration-300 ease-in-out"
            />
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col w-full px-4 mt-6 overflow-y-auto overflow-x-hidden">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
          const isOpen = openDropdowns.includes(item.name);

          return (
            <div key={item.name} className="relative mb-2">
              {item.children ? (
                <button
                  onClick={() => !collapsed && toggleDropdown(item.name)}
                  className={itemBaseClass(!!isActive)}
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                     <item.icon className="w-5 h-5" />
                  </div>

                  <div 
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex items-center flex-1",
                      collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100 ml-3"
                    )}
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                    <ChevronDown 
                      className={cn(
                        "ml-auto h-4 w-4 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )} 
                    />
                  </div>
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={itemBaseClass(pathname === item.href)}
                  title={collapsed ? item.name : undefined}
                >
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                     <item.icon className="w-5 h-5" />
                  </div>

                  <div 
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap flex items-center flex-1",
                      collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[200px] opacity-100 ml-3"
                    )}
                  >
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                </Link>
              )}

              {/* Dropdown Children */}
              {item.children && (
                <div 
                  className={cn(
                    "overflow-hidden transition-all duration-300 ease-in-out",
                    !collapsed && isOpen ? "max-h-[500px] opacity-100 mt-1" : "max-h-0 opacity-0 mt-0"
                  )}
                >
                  <div className="ml-4 border-l pl-4 space-y-1">
                    {item.children.map((child) => {
                      const isChildActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            "block py-2 px-3 rounded-md text-sm transition-colors truncate",
                            isChildActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          {child.name}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        "border-t p-4 transition-all duration-300",
        collapsed ? "items-center" : "items-start"
      )}>
        <div className={cn(
          "flex items-center w-full transition-all duration-300 ease-in-out",
          collapsed ? "justify-center" : "justify-start gap-3"
        )}>
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-semibold">
            {user?.name?.charAt(0) || "U"}
          </div>
          
          <div className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out flex flex-col",
            collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-[150px] opacity-100 ml-0"
          )}>
            <p className="text-sm font-medium truncate whitespace-nowrap">{user?.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate whitespace-nowrap">{user?.role || "Role"}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          className={cn(
            "mt-4 w-full flex items-center transition-all duration-300 bg-transparent border-gray-200 hover:bg-red-50 hover:text-red-600",
            collapsed ? "justify-center px-0" : "justify-start px-3 gap-3"
          )} 
          onClick={logout}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          <span className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
            collapsed ? "max-w-0 opacity-0" : "max-w-[100px] opacity-100"
          )}>
            Sign out
          </span>
        </Button>
      </div>
    </div>
  )
}