"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Building2, 
  LayoutDashboard, 
  Ticket, 
  LogOut, 
  ChevronDown, 
  ServerCog, 
  Users, 
  Settings 
} from "lucide-react"
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
    name: "Package Management",
    href: "/portal/packages",
    icon: Ticket,
  },
  {
    name: "IT POSWF",
    icon: ServerCog,
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
    name: "Users",
    href: "/portal/page-3",
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
  const [openDropdowns, setOpenDropdowns] = useState<string[]>(["IT POSWF"])

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => (prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]))
  }

  // Common classes for both Links and Buttons to ensure they look identical
  const itemBaseClass = (isActive: boolean) => cn(
    "group flex items-center w-full rounded-lg py-3 transition-all duration-300 ease-in-out",
    isActive 
      ? "bg-primary text-primary-foreground" 
      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
    collapsed ? "justify-center px-0" : "justify-start px-3"
  )

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-card transition-[width] duration-300 ease-in-out overflow-hidden z-50 shadow-xl",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-[85px] items-center justify-center border-b py-6 transition-all duration-300 flex-shrink-0">
        <div
          className={cn(
            "relative h-[51px] transition-all duration-300 ease-in-out overflow-hidden",
            collapsed ? "w-[60px]" : "w-[145px]"
          )}
        >
           {/* FIXED: Reverted to Solid Primary Color */}
           <div className="flex items-center justify-center w-full h-full bg-primary rounded-lg text-primary-foreground">
              <Building2 className="h-8 w-8" />
           </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col w-full px-4 mt-6 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
          const isOpen = openDropdowns.includes(item.name);

          return (
            <div key={item.name} className="relative mb-2">
              {/* LOGIC FIX: 
                  If it has children -> Render a <button> to toggle dropdown
                  If it has NO children -> Render a <Link> to navigate
              */}
              {item.children ? (
                <button
                  onClick={() => !collapsed && toggleDropdown(item.name)}
                  className={itemBaseClass(!!isActive)}
                  title={collapsed ? item.name : undefined}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                     <item.icon className="w-5 h-5" />
                  </div>

                  {/* Text */}
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
                  {/* Icon */}
                  <div className="flex-shrink-0 flex items-center justify-center w-6 h-6">
                     <item.icon className="w-5 h-5" />
                  </div>

                  {/* Text */}
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

      {/* Footer / User Profile */}
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