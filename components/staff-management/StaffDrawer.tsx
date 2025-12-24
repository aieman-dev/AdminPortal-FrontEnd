"use client"

import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
    Shield, FileText, LogIn, 
    XCircle, Activity, Mail, Calendar as CalendarIcon 
} from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar" 
import { STAFF_ROLES } from "@/lib/constants"
import { StaffMember } from "@/type/staff"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { formatDate } from "@/lib/formatter"

// --- MOCK DATA GENERATOR ---
const generateMockActivities = (staffId: string) => {
    const idNum = parseInt(staffId) || 0;
    const actions = [
        { type: "login", label: "System Login", icon: LogIn, color: "text-blue-500", bg: "bg-blue-100 dark:bg-blue-900/30" },
        { type: "update", label: "Updated Package", icon: FileText, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/30" },
        { type: "void", label: "Voided Transaction", icon: XCircle, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
        { type: "sync", label: "Synced Terminal", icon: Activity, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
        { type: "security", label: "Password Change", icon: Shield, color: "text-purple-500", bg: "bg-purple-100 dark:bg-purple-900/30" },
    ];

    const dates = ["Today", "Yesterday", "24 Dec 2023", "20 Dec 2023"];
    
    return dates.map((date, dateIdx) => ({
        date,
        items: Array.from({ length: 3 + (idNum % 4) }).map((_, idx) => {
            const action = actions[(idNum + idx + dateIdx) % actions.length];
            return {
                id: `${dateIdx}-${idx}`,
                time: `${9 + idx}:3${idx} ${idx % 2 === 0 ? 'AM' : 'PM'}`,
                action: action.label,
                detail: action.type === 'void' ? `TRX-${10000 + idx} (Customer Request)` : 
                        action.type === 'update' ? `Modified "Family Package" price` : 
                        action.type === 'login' ? `Successful login from 192.168.1.${10 + idx}` : 
                        `System action executed successfully`,
                meta: action
            }
        })
    }));
};

interface StaffDrawerProps {
    staff: StaffMember | null;
    isOpen: boolean;
    onClose: () => void;
}

export function StaffDrawer({ staff, isOpen, onClose }: StaffDrawerProps) {
    const [activeTab, setActiveTab] = useState("activity");
    const [mockHistory, setMockHistory] = useState<any[]>([]);
    const [date, setDate] = useState<Date | undefined>(new Date())

    useEffect(() => {
        if (staff) {
            setMockHistory(generateMockActivities(staff.id));
        }
    }, [staff]);

    if (!staff) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            <SheetContent 
                side="right" 
                className="w-full sm:w-[540px] p-0 border-l border-border shadow-2xl bg-card"
            >
                {/* 1. HEADER SECTION */}
                <div className="p-6 border-b bg-muted/20">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
                            <AvatarFallback className="text-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                                {staff.fullName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-xl leading-none">{staff.fullName}</SheetTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="font-normal text-xs">
                                    {staff.roleName}
                                </Badge>
                                <span>•</span>
                                <span className="font-mono text-xs">ID: {staff.accId}</span>
                            </div>
                            <div className="pt-1">
                                <StatusBadge status={staff.status} className="h-5 text-[10px] px-2" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. TABS */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-140px)] flex flex-col">
                    <div className="px-6 pt-4 pb-2 flex items-center justify-between border-b bg-muted/10">
                        <TabsList className="w-[240px] grid grid-cols-2">
                            <TabsTrigger value="activity">Activity Log</TabsTrigger>
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                        </TabsList>
                        
                        {/* AUDIT FILTER: Only show on Activity tab */}
                        {activeTab === "activity" && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                                        <CalendarIcon className="h-3.5 w-3.5" />
                                        <span>Filter Date</span>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        initialFocus
                                    />
                                    <div className="p-2 border-t text-xs text-center text-muted-foreground">
                                        Select date to load historical logs
                                    </div>
                                </PopoverContent>
                            </Popover>
                        )}
                    </div>

                    {/* Timeline Container */}
                    <TabsContent value="activity" className="flex-1 overflow-hidden relative mt-0">
                        <ScrollArea className="h-full px-6 pb-6">
                            <div className="space-y-8 pt-4">
                                {/* FIX: You were missing the map loop here! */}
                                {mockHistory.map((group, gIdx) => (
                                    <div key={gIdx} className="relative">
                                        <div className="sticky top-0 z-10 bg-card pb-3 pt-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded-sm">
                                                {group.date}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-6 ml-2 border-l-2 border-border pl-6 relative">
                                            {group.items.map((item: any) => (
                                                <div key={item.id} className="relative group">
                                                    {/* Timeline Dot */}
                                                    <div className={`absolute -left-[31px] top-1 h-2.5 w-2.5 rounded-full ring-4 ring-card ${item.meta.bg.replace('/30','')} ${item.meta.color}`} />
                                                    
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-semibold text-foreground">
                                                                {item.action}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground font-mono">
                                                                {item.time}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground leading-relaxed">
                                                            {item.detail}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="text-center py-8">
                                    <p className="text-xs text-muted-foreground mb-2">
                                        Showing last 20 activities
                                    </p>
                                    <Button variant="outline" size="sm" className="w-full text-xs">
                                        Load older activities...
                                    </Button>
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    {/* TAB CONTENT: PROFILE */}
                    <TabsContent value="profile" className="flex-1 overflow-y-auto mt-0">
                        <div className="p-6 space-y-6">
                            {/* Read-Only Info */}
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground uppercase">Email (Login ID)</Label>
                                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-md border text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        {staff.email}
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs text-muted-foreground uppercase">Joined Date</Label>
                                    <div className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-md border text-sm">
                                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                       {formatDate(staff.createdDate)}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Editable Actions */}
                            <div className="space-y-4">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4" /> Access Management
                                </h4>
                                
                                <div className="grid gap-2">
                                    <Label>System Role</Label>
                                    <Select 
                                        key={`role-${staff.accId}`} 
                                        defaultValue={staff.roleName}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={staff.roleName} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STAFF_ROLES.map((role) => (
                                                <SelectItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label>Account Status</Label>
                                    <Select 
                                        key={`status-${staff.accId}`} 
                                        defaultValue={staff.status}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={staff.status} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2 flex gap-3">
                                    <Button className="flex-1" size="sm">Save Changes</Button>
                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">Reset Password</Button>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </SheetContent>
        </Sheet>
    )
}