"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
    Sheet, SheetContent, SheetHeader, SheetTitle,SheetFooter, SheetDescription 
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { Loader2, Trash2, Save, Mail, Briefcase, User, Clock } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { StaffDetail } from "@/type/hr"
import { hrService } from "@/services/hr-services"
import { formatDateTime } from "@/lib/formatter"

// Validation Schema
const staffEditSchema = z.object({
    fullName: z.string().min(1, "Name is required"),
    staffNo: z.string().min(1, "Staff Number is required"),
    department: z.string().min(1, "Department is required"),
    email: z.string().email(),
})

type StaffEditValues = z.infer<typeof staffEditSchema>

interface StaffEditSheetProps {
    isOpen: boolean;
    onClose: () => void;
    staff: StaffDetail | null;
    onSave: (data: StaffEditValues) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export function StaffEditSheet({ isOpen, onClose, staff, onSave, onDelete }: StaffEditSheetProps) {
    const toast = useAppToast()
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const [departments, setDepartments] = useState<{code: string, name: string}[]>([])

    const form = useForm<StaffEditValues>({
        resolver: zodResolver(staffEditSchema),
        defaultValues: { fullName: "", staffNo: "", department: "", email: "" }
    })

    // Fetch departments on mount
    useEffect(() => {
        const loadDepts = async () => {
             const data = await hrService.getDepartments();
             setDepartments(data);
        };
        loadDepts();
    }, []);


    // Update form when staff selection changes
    useEffect(() => {
        if (staff) {
            form.reset({
                fullName: staff.staffName,
                staffNo: staff.staffNo,
                department: staff.departmentCode,
                email: staff.email
            })
        }
    }, [staff, form])

    // simulate
    const onSubmit = async (data: StaffEditValues) => {
        setIsSaving(true)
        try {
            await onSave(data)
            toast.success("Updated", "Staff details updated successfully.")
            onClose()
        } catch (error) {
            toast.error("Error", "Failed to update staff.")
        } finally {
            setIsSaving(false)
        }
    }

    // simulate
    const handleDelete = async () => {
        setIsDeleting(true)
        try {
            //await onDelete(String(staff.staffId))
            toast.success("Deleted", "Staff account removed.")
            setShowDeleteConfirm(false)
            onClose()
        } catch (error) {
            toast.error("Error", "Failed to delete account.")
        } finally {
            setIsDeleting(false)
        }
    }

    if (!staff) return null;

    return (
        <>
            {/* modal={false} removes the overlay, allowing interactions with the background */}
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()} modal={false}>
                <SheetContent 
                    side="right" 
                    className="w-full sm:max-w-[450px] p-0 border-l shadow-2xl bg-background flex flex-col h-full focus:outline-none"
                    onOpenAutoFocus={(e) => e.preventDefault()} // Prevents stealing focus immediately
                >
                    {/* --- MODERN HEADER --- */}
                    <div className="p-6 border-b flex-shrink-0 bg-muted/5">
                        <div className="flex items-start gap-4">
                            <Avatar className="h-16 w-16 border shadow-sm">
                                <AvatarFallback className="text-xl bg-primary/10 text-primary">
                                    {staff.staffName?.charAt(0) || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-1.5 flex-1 min-w-0">
                                <SheetTitle className="text-xl leading-none truncate" title={staff.staffName}>
                                    {staff.staffName}
                                </SheetTitle>
                                <SheetDescription className="text-xs">
                                    Manage staff profile details
                                </SheetDescription>
                                
                                <div className="flex flex-wrap items-center gap-2 pt-1">
                                    <Badge variant="outline" className="font-normal text-xs bg-background">
                                        {staff.staffNo}
                                    </Badge>
                                    <Badge variant="secondary" className="font-normal text-xs px-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200">
                                        {staff.departmentCode}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- SCROLLABLE CONTENT --- */}
                    <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
                        
                        {/* 1. Identity Section (Read-Onlyish) */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <User className="h-3.5 w-3.5" /> Identity
                            </h4>
                            
                            <div className="grid gap-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground">SuperApp Email</Label>
                                    <div className="flex items-center gap-2 mt-1 p-2.5 bg-muted/40 rounded-md border text-sm text-foreground">
                                        <Mail className="h-4 w-4 text-muted-foreground/70" />
                                        <span className="font-medium truncate">{staff.email || "No Email Linked"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* 2. Editable Fields */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Briefcase className="h-3.5 w-3.5" /> Employment Details
                            </h4>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                                    <Input 
                                        {...form.register("fullName")} 
                                        className="h-10" 
                                    />
                                    {form.formState.errors.fullName && <p className="text-xs text-red-500">{form.formState.errors.fullName.message}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="staffNo" className="text-sm font-medium">Staff ID</Label>
                                        <Input 
                                            {...form.register("staffNo")} 
                                            className="h-10" 
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="department" className="text-sm font-medium">Department</Label>
                                        <Select 
                                            onValueChange={(val) => form.setValue("department", val)} 
                                            defaultValue={staff?.departmentCode}
                                            value={form.watch("department")}
                                        >
                                            <SelectTrigger className="h-10 w-full overflow-hidden truncate">
                                                <SelectValue placeholder="Select" className="truncate" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((dept, idx) => (
                                                    <SelectItem key={`${dept.code}-${idx}`} value={dept.code}>
                                                        {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Metadata */}
                        <div className="space-y-3">
                             <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" /> Audit Trail
                            </h4>
                            <div className="grid grid-cols-1 gap-3 p-3 bg-muted/20 rounded-lg border">
                                {/* Created By */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Created By:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{staff.createdBy}</span>
                                        <Badge variant="secondary" className="h-5 font-mono text-[10px] bg-muted border-border">
                                            {formatDateTime(staff.createdDate)}
                                        </Badge>
                                    </div>
                                </div>
                                {/* Modified By */}
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Modified By:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{staff.modifiedBy}</span>
                                        <Badge variant="secondary" className="h-5 font-mono text-[10px] bg-muted border-border">
                                            {formatDateTime(staff.modifiedDate)}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/*  Danger Zone */}
                         <div className="space-y-3">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <Trash2 className="h-3.5 w-3.5" /> Danger Zone
                            </h4>
                            
                            <div className="p-4 rounded-lg border border-red-200 bg-red-50/30 dark:bg-red-900/10 space-y-3">
                                <div className="flex justify-between items-center">
                                    <div className="text-sm font-medium text-red-900 dark:text-red-200">Delete Staff Account</div>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    This will permanently remove the staff member and revoke all access.
                                </p>
                                <Button 
                                    variant="destructive" 
                                    size="sm" 
                                    className="w-full bg-red-600 hover:bg-red-700 text-white shadow-none h-9"
                                    onClick={() => setShowDeleteConfirm(true)}
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>

                    </div>

                    {/* --- FOOTER ACTIONS --- */}
                    <SheetFooter className="p-6 border-t bg-background flex-col gap-3 flex-shrink-0">
                        <Button 
                            onClick={form.handleSubmit(onSubmit)} 
                            disabled={isSaving} 
                            className="w-full bg-black hover:bg-zinc-800 text-white h-11"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                            Save Changes
                        </Button>
                    </SheetFooter>
                </SheetContent>
            </Sheet>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Staff Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{staff?.staffName}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? "Deleting..." : "Confirm Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}