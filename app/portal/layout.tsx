//app/portal/layout
"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/portal/sidebar"
import { Header } from "@/components/portal/header"
import { ProtectedRoute } from "@/components/portal/protected-route"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/toaster"

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)

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
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 overflow-y-auto bg-background">
            <div className="container mx-auto p-6">{children}</div>
          </main>
        </div>
      </div>

      <Toaster />
      
    </ProtectedRoute>
  )
}