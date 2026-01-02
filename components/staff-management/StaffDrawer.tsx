"use client"

import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { 
    Shield, Mail, Calendar as CalendarIcon, User, RefreshCw
} from "lucide-react"
import { STAFF_ROLES } from "@/lib/constants"
import { StaffMember } from "@/type/staff"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { formatDate } from "@/lib/formatter"

interface StaffDrawerProps {
    staff: StaffMember | null;
    isOpen: boolean;
    onClose: () => void;
}

export function StaffDrawer({ staff, isOpen, onClose }: StaffDrawerProps) {
    if (!staff) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            <SheetContent 
                side="right" 
                className="w-full sm:max-w-[450px] p-0 border-l shadow-2xl bg-background flex flex-col h-full focus:outline-none"
            >
                {/* HEADER */}
                <div className="p-6 border-b flex-shrink-0">
                    <div className="flex items-start gap-4">
                        <Avatar className="h-16 w-16 border shadow-sm">
                            <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                {staff.fullName?.charAt(0) || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1.5">
                            <SheetTitle className="text-xl leading-none">{staff.fullName}</SheetTitle>
                            <SheetDescription className="text-xs">User Account Details</SheetDescription>
                            
                            <div className="flex items-center gap-2 pt-1">
                                <Badge variant="outline" className="font-normal text-xs">{staff.roleName}</Badge>
                                <span className="text-muted-foreground text-xs">ID: {staff.accId}</span>
                            </div>
                            <div className="pt-1">
                                <StatusBadge status={staff.status} className="h-5 text-[10px] px-2" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT - Optimized for "At a Glance" view */}
                <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
                    
                    {/* Personal Info */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <User className="h-3.5 w-3.5" /> Personal Information
                        </h4>
                        
                        <div className="grid gap-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Email / Login ID</Label>
                                <div className="flex items-center gap-2 mt-1 p-2 bg-muted/40 rounded-md border text-sm">
                                    <Mail className="h-4 w-4 text-muted-foreground/70" />
                                    <span className="font-medium truncate">{staff.email}</span>
                                </div>
                            </div>
                            
                            <div>
                                <Label className="text-xs text-muted-foreground">Date Joined</Label>
                                <div className="flex items-center gap-2 mt-1 p-2 bg-muted/40 rounded-md border text-sm">
                                    <CalendarIcon className="h-4 w-4 text-muted-foreground/70" />
                                    <span className="font-medium">{formatDate(staff.createdDate)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    {/* Access Control - SIDE BY SIDE LAYOUT */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Shield className="h-3.5 w-3.5" /> Access & Roles
                        </h4>
                        
                        <div className="p-4 rounded-lg border bg-card shadow-sm">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">System Role</Label>
                                    <Select defaultValue={staff.roleName}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder={staff.roleName} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {STAFF_ROLES.map(r => (
                                                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Account Status</Label>
                                    <Select defaultValue={staff.status}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue placeholder={staff.status} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                            <SelectItem value="Suspended">Suspended</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-6 border-t bg-muted/5 flex flex-col gap-3 flex-shrink-0">
                    <Button className="w-full shadow-sm">Save Changes</Button>
                    <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 h-9">
                        <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reset Password
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}