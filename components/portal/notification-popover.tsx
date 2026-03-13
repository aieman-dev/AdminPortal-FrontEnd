"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { 
  Bell, Check, Clock, AlertTriangle, 
  Info, XCircle, Inbox 
} from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Drawer, DrawerContent, DrawerTrigger, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getRelativeTime } from "@/lib/formatter"
import { useIsMobile } from "@/hooks/use-mobile"

export interface NotificationItem {
  id: number
  title: string
  message: string
  type: string
  isRead: boolean
  createdDate: string
  relatedId?: string | null
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
  const isMobile = useIsMobile()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")

  // Combine and Sort by Date
  const allNotifications: NotificationItem[] = [
    ...broadcasts.map(b => ({ ...b, source: "broadcast" } as NotificationItem)),
    ...personal.map(p => ({ ...p, source: "personal" } as NotificationItem))
  ].sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime())

  const systemNotifications = allNotifications.filter(n => n.source === "broadcast")
  const personalNotifications = allNotifications.filter(n => n.source === "personal")

  const getIcon = (type: string) => {
    const t = type.toLowerCase()
    if (t === 'critical') return <XCircle className="h-4 w-4 text-red-500" />
    if (t === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500" />
    return <Info className="h-4 w-4 text-blue-500" />
  }

  // --- SMART ROUTING LOGIC (Approach A: Prefixes) ---
  const handleNotificationClick = (item: NotificationItem) => {
    // 1. Trigger the read API
    onMarkAsRead?.(item.id, item.source)

    // 2. Routing Logic
    if (item.relatedId) {
      
      // Check if it's using the new Prefix format (e.g., "PKG-124")
      if (item.relatedId.includes("-")) {
        const dashIndex = item.relatedId.indexOf("-");
        const moduleCode = item.relatedId.substring(0, dashIndex).toUpperCase();
        const targetId = item.relatedId.substring(dashIndex + 1);

        setIsOpen(false); // Close popover

        switch (moduleCode) {
          case "PKGREQ":
            // Route to Pending/Rejected Request View
            router.push(`/portal/packages/pdetails/requests/${targetId}`);
            break;
          case "PKG":
            // Route to Live Package View
            router.push(`/portal/packages/pdetails/package/${targetId}`);
            break;
          case "CPA":
            // Route to Car Park Application
            router.push(`/portal/car-park/application/${targetId}`);
            break;
          case "AUDIT":
            // Route to Activity Audit (Great for MIS!)
            router.push(`/portal/staff-management?tab=audit&search=${targetId}`);
            break;
          default:
            console.warn(`Unknown notification routing module: ${moduleCode}`);
            break;
        }
      } 
      // LEGACY FALLBACK: If backend just sends "124" without a prefix yet
      else {
        const titleLower = item.title.toLowerCase();
        
        if (titleLower.includes("package")) {
          setIsOpen(false); 
          if (titleLower.includes("approved") || titleLower.includes("active")) {
            router.push(`/portal/packages/pdetails/package/${item.relatedId}`);
          } else {
            router.push(`/portal/packages/pdetails/requests/${item.relatedId}`);
          }
        }
      }
    }
  }

  // REFACTOR: Accept className to allow dynamic height on mobile vs fixed on desktop
  const NotificationList = ({ items, className }: { items: NotificationItem[], className?: string }) => {
    if (items.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
          <Inbox className="h-10 w-10 mb-2 opacity-20" />
          <p className="text-sm">No notifications</p>
        </div>
      )
    }

    return (
      <ScrollArea className={cn("h-[350px]", className)}>
        <div className="flex flex-col">
          {items.map((item) => (
            <button
              key={`${item.source}-${item.id}`}
              onClick={() => onMarkAsRead?.(item.id, item.source)}
              className={cn(
                "flex items-start gap-3 p-4 text-left border-b transition-colors hover:bg-muted/50 w-full",
                !item.isRead ? "bg-muted/30" : "bg-transparent",
                item.relatedId ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div className={cn(
                "mt-1 h-2 w-2 shrink-0 rounded-full",
                !item.isRead ? "bg-blue-600" : "bg-transparent"
              )} />
              
              <div className="flex-1 space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("text-sm font-medium leading-none truncate", !item.isRead && "font-bold")}>
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
                  <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4", 
                    item.source === 'broadcast' ? "border-amber-200 text-amber-700 bg-amber-50" : "border-blue-200 text-blue-700 bg-blue-50"
                  )}>
                    {item.source === 'broadcast' ? "System" : "Personal"}
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </ScrollArea>
    )
  }

  const TriggerButton = (
    <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
        <div className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-[9px] font-bold text-white ring-2 ring-card animate-in zoom-in duration-300">
            {unreadCount > 99 ? '99+' : unreadCount}
            </span>
        )}
        </div>
    </Button>
  )

  // REFACTOR: Unified Content Variable used by both Drawer and Popover
  const contentBody = (
      <div className="flex flex-col h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b shrink-0">
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

        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0 w-full">
          <div className="px-4 pt-2 shrink-0">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="system" className="text-xs">System</TabsTrigger>
              <TabsTrigger value="personal" className="text-xs">Personal</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 mt-2">
             {/* Pass h-full to scroll area on mobile to fill drawer space */}
             <TabsContent value="all" className="h-full m-0 data-[state=inactive]:hidden">
                <NotificationList items={allNotifications} className={isMobile ? "h-[60vh]" : "h-[350px]"} />
             </TabsContent>
             <TabsContent value="system" className="h-full m-0 data-[state=inactive]:hidden">
                <NotificationList items={systemNotifications} className={isMobile ? "h-[60vh]" : "h-[350px]"} />
             </TabsContent>
             <TabsContent value="personal" className="h-full m-0 data-[state=inactive]:hidden">
                <NotificationList items={personalNotifications} className={isMobile ? "h-[60vh]" : "h-[350px]"} />
             </TabsContent>
          </div>
        </Tabs>
        
        {/* Footer */}
        <div className="p-2 border-t bg-muted/30 text-center shrink-0">
            <Button variant="link" size="sm" className="text-xs h-auto py-1 text-muted-foreground" onClick={() => setIsOpen(false)}>
                Close
            </Button>
        </div>
      </div>
  )

  if (isMobile) {
      return (
          <Drawer open={isOpen} onOpenChange={setIsOpen}>
              <DrawerTrigger asChild>{TriggerButton}</DrawerTrigger>
              <DrawerContent className="px-0 max-h-[85vh]">
                  <DrawerHeader className="sr-only">
                      <DrawerTitle>Notifications</DrawerTitle>
                  </DrawerHeader>
                  {contentBody}
              </DrawerContent>
          </Drawer>
      )
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>{TriggerButton}</PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end" sideOffset={5}>
        {contentBody}
      </PopoverContent>
    </Popover>
  )
}