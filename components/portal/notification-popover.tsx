"use client"

import { useState } from "react"
import { 
  Bell, Check, Clock, AlertTriangle, 
  Info, XCircle, Mail, Megaphone, Inbox 
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getRelativeTime } from "@/lib/formatter" // Assuming this exists from your other files

// Define types based on your JSON structure
export interface NotificationItem {
  id: number
  title: string
  message: string
  type: string // "warning" | "Info" | "critical"
  isRead: boolean
  createdDate: string
  source: "broadcast" | "personal"
}

interface NotificationPopoverProps {
  unreadCount: number
  broadcasts: any[]
  personal: any[]
  onMarkAsRead?: (id: number, source: string) => void
  onMarkAllRead?: () => void
}

export function NotificationPopover({ 
  unreadCount, 
  broadcasts = [], 
  personal = [],
  onMarkAsRead,
  onMarkAllRead
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Combine and Sort by Date (Newest First)
  const allNotifications: NotificationItem[] = [
    ...broadcasts.map(b => ({ ...b, source: "broadcast" } as NotificationItem)),
    ...personal.map(p => ({ ...p, source: "personal" } as NotificationItem))
  ].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())

  const systemNotifications = allNotifications.filter(n => n.source === "broadcast")
  const personalNotifications = allNotifications.filter(n => n.source === "personal")

  // Helper to render icon based on type
  const getIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t === 'critical') return <XCircle className="h-4 w-4 text-red-500" />
    if (t === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />
    return <Info className="h-4 w-4 text-blue-500" />
  }

  const NotificationList = ({ items }: { items: NotificationItem[] }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <Inbox className="h-10 w-10 mb-2 opacity-20" />
          <p className="text-sm">No notifications</p>
        </div>
      )
    }

    return (
      <ScrollArea className="h-[350px]">
        <div className="flex flex-col">
          {items.map((item) => (
            <button
              key={`${item.source}-${item.id}`}
              onClick={() => onMarkAsRead?.(item.id, item.source)}
              className={cn(
                "flex items-start gap-3 p-4 text-left border-b transition-colors hover:bg-muted/50",
                !item.isRead ? "bg-muted/30" : "bg-transparent"
              )}
            >
              <div className={cn(
                "mt-1 h-2 w-2 shrink-0 rounded-full",
                !item.isRead ? "bg-blue-600" : "bg-transparent"
              )} />
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-sm font-medium leading-none", !item.isRead && "font-bold")}>
                    {item.title}
                  </span>
                  {getIcon(item.type)}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {item.message}
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {getRelativeTime(item.createdDate)}
                  </span>
                  {item.source === 'broadcast' ? (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-amber-200 text-amber-700 bg-amber-50">System</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-blue-200 text-blue-700 bg-blue-50">Personal</Badge>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
          {/* THE BELL ICON WITH BADGE */}
          <div className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-card animate-in zoom-in duration-300">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={5}>
        <div className="flex items-center justify-between p-4 border-b">
          <div className="font-semibold text-sm">Notifications</div>
          {unreadCount > 0 && (
            <Button 
                variant="ghost" 
                size="sm" 
                className="h-auto px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={onMarkAllRead}
            >
              <Check className="mr-1 h-3 w-3" /> Mark all read
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="system" className="text-xs gap-1">
                 System
              </TabsTrigger>
              <TabsTrigger value="personal" className="text-xs gap-1">
                 Personal
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-2 border-t">
            <NotificationList items={allNotifications} />
          </TabsContent>
          <TabsContent value="system" className="mt-2 border-t">
            <NotificationList items={systemNotifications} />
          </TabsContent>
          <TabsContent value="personal" className="mt-2 border-t">
            <NotificationList items={personalNotifications} />
          </TabsContent>
        </Tabs>
        
        {/* Footer */}
        <div className="p-2 border-t bg-muted/30 text-center">
            <Button variant="link" size="sm" className="text-xs h-auto py-1 text-muted-foreground" onClick={() => setIsOpen(false)}>
                Close
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}