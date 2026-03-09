"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { 
    Shield, Mail, Calendar as CalendarIcon, User, RefreshCw, Clock, Loader2, Key
} from "lucide-react"
import { useAppToast } from "@/hooks/use-app-toast"
import { useIsMobile } from "@/hooks/use-mobile"
import { STAFF_ROLES } from "@/lib/constants"
import { StaffMember } from "@/type/staff"
import { staffService } from "@/services/staff-services"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { formatDate } from "@/lib/formatter"
import { DatePicker } from "@/components/ui/date-picker"
import { addMonths, addYears } from "date-fns"

interface StaffDrawerProps {
    staff: StaffMember | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

export function StaffDrawer({ staff, isOpen, onClose, onUpdate }: StaffDrawerProps) {
    const toast = useAppToast();
    const isMobile = useIsMobile();

    const [selectedRole, setSelectedRole] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("");
    const [durationMode, setDurationMode] = useState("permanent");
    const [customExpiryDate, setCustomExpiryDate] = useState<Date | undefined>(undefined);
    
    const [manualPassword, setManualPassword] = useState("");

    const [isSaving, setIsSaving] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    
    useEffect(() => {
        if (staff) {
            setSelectedRole(staff.roleName || "");
            setSelectedStatus(staff.status || "Active");
            setManualPassword("");

            const expiry = (staff as any).expiryDate;
            if (expiry) {
                setDurationMode("custom");
                setCustomExpiryDate(new Date(expiry));
            } else {
                setDurationMode("permanent");
                setCustomExpiryDate(undefined);
            }
        }
    }, [staff]);

    const handleDurationChange = (value: string) => {
        setDurationMode(value);
        const today = new Date();

        switch (value) {
            case "3_months": setCustomExpiryDate(addMonths(today, 3)); break;
            case "6_months": setCustomExpiryDate(addMonths(today, 6)); break;
            case "1_year": setCustomExpiryDate(addYears(today, 1)); break;
            case "2_years": setCustomExpiryDate(addYears(today, 2)); break;
            case "permanent": setCustomExpiryDate(undefined); break;
            case "custom": setCustomExpiryDate(undefined); break;
        }
    };

    const handleSaveChanges = async () => {
        if (!staff || !staff.roleId) {
            toast.error("Error", "Missing Role ID. Cannot update.");
            return;
        }

        setIsSaving(true);

        try {
            const payload = {
                roleId: staff.roleId, 
                roleName: selectedRole,
                expiryDate: customExpiryDate ? customExpiryDate.toISOString() : null, 
                recordStatus: selectedStatus
            };

            console.log("Sending Update Payload:", payload);
            await staffService.updateStaffRole(payload);

            toast.success( "Success", "User role details updated successfully." );

            if (onUpdate) onUpdate();
            onClose();

        } catch (error) {
            console.error("Update Error:", error);
            toast.error( "Update Failed",  error instanceof Error ? error.message : "Could not update role.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetPassword = async () => {
        if (!staff) return;
        if (!manualPassword.trim()) {
            toast.error("Input Required", "Please enter a new password.");
            return;
        }

        setIsResetting(true);

        try {
            await staffService.resetStaffPassword(staff.accId, manualPassword.trim());

            toast.success("Password Reset", `Password for ${staff.fullName} has been updated.`);
            setManualPassword(""); // Clear after success

        } catch (error) {
            console.error("Reset Error:", error);
            toast.error("Reset Failed", error instanceof Error ? error.message : "Could not reset password.");
        } finally {
            setIsResetting(false);
        }
    };
    
    if (!staff) return null;

    const currentExpiry = (staff as any).expiryDate;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
            <SheetContent 
                side={isMobile ? "bottom" : "right"} 
                className={`w-full p-0 shadow-2xl bg-background flex flex-col focus:outline-none 
                    ${isMobile ? "h-[85vh] rounded-t-2xl border-t mt-24" : "h-full sm:max-w-[450px] border-l"}`}
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
                            <div>
                                    <Label className="text-xs text-muted-foreground">Expiry Date</Label>
                                    <div className="flex items-center gap-2 mt-1 p-2 bg-muted/40 rounded-md border text-sm">
                                        <Clock className="h-4 w-4 text-muted-foreground/70" />
                                        <span className={`font-medium ${currentExpiry ? "text-orange-600" : ""}`}>
                                            {currentExpiry ? formatDate(currentExpiry) : "Permanent"}
                                        </span>
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
                                    <Select value={selectedRole} onValueChange={setSelectedRole}>
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
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Duration / Expiry</Label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <Select onValueChange={handleDurationChange} value={durationMode}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Select Duration" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="permanent">Permanent</SelectItem>
                                                <SelectItem value="3_months">3 Months</SelectItem>
                                                <SelectItem value="6_months">6 Months</SelectItem>
                                                <SelectItem value="1_year">1 Year</SelectItem>
                                                <SelectItem value="2_years">2 Years</SelectItem>
                                                <SelectItem value="custom">Custom Date</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex-1">
                                        <DatePicker 
                                            date={customExpiryDate} 
                                            setDate={setCustomExpiryDate} 
                                            disabled={durationMode !== 'custom'} 
                                            placeholder={durationMode === 'permanent' ? "No Expiry" : "Pick date"}
                                            className="h-9 w-full"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                <Separator />

                    {/* NEW: Security / Password Reset Section */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Key className="h-3.5 w-3.5" /> Security
                        </h4>
                        
                        <div className="p-4 rounded-lg border bg-muted/20 space-y-3">
                            <Label className="text-sm font-medium">Password Reset</Label>
                            <div className="flex gap-2">
                                <Input 
                                    placeholder="Enter new password..." 
                                    value={manualPassword}
                                    onChange={(e) => setManualPassword(e.target.value)}
                                    type="text" 
                                    className="h-9 bg-background"
                                />
                                <Button 
                                    onClick={handleResetPassword} 
                                    disabled={isResetting || !manualPassword.trim()}
                                    className="h-9 shrink-0"
                                    variant="destructive"
                                >
                                    {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                                    Reset
                                </Button>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                Admin override: This will immediately change the user's login password.
                            </p>
                        </div>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="p-6 border-t bg-muted/5 flex flex-col gap-3 flex-shrink-0">
                    <LoadingButton 
                        className="w-full shadow-sm" 
                        onClick={handleSaveChanges} 
                        isLoading={isSaving}
                        loadingText="Saving..."
                    >
                        Save Changes
                    </LoadingButton>
                </div>
            </SheetContent>
        </Sheet>
    )
}