"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Key, User, Briefcase, RefreshCw, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { useAppToast } from "@/hooks/use-app-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb"
import { LoaderState } from "@/components/ui/loader-state"
import { StaffAccount } from "@/type/staff"


const mockRoles = ["IT Admin", "MIS Superadmin", "Package Manager", "Package Creator", "View Only"]

const mockFetchStaff = (id: string): Promise<StaffAccount | null> => {
    return new Promise((resolve) => setTimeout(() => {
        if (id === "S101") {
            resolve({ id: "S101", name: "Jane Smith", email: "jane.s@icity.com", department: "Package Operations", role: "Package Creator", status: "Active", createdDate: "2024-05-10" })
        } else {
            resolve({ id: id, name: `Mock User ${id}`, email: `user.${id.toLowerCase()}@icity.com`, department: "HR", role: "View Only", status: "Inactive", createdDate: "2024-11-01" })
        }
    }, 500))
}

interface StaffDetailsPageProps {
    staffId: string
}

export function StaffDetailsPage({ staffId }: StaffDetailsPageProps) {
    const toast = useAppToast()
    const [staffData, setStaffData] = useState<StaffAccount | null>(null)
    const [loading, setLoading] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    
    // Editable State
    const [newRole, setNewRole] = useState("")
    const [newStatus, setNewStatus] = useState("")

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true)
            const data = await mockFetchStaff(staffId)
            setStaffData(data)
            if (data) {
                setNewRole(data.role)
                setNewStatus(data.status)
            }
            setLoading(false)
        }
        fetchDetails()
    }, [staffId])
    
    const handleUpdate = async () => {
        if (!staffData) return;
        setIsUpdating(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        const updatedStaff = { ...staffData, role: newRole, status: newStatus as StaffAccount['status'] }
        setStaffData(updatedStaff)
        toast.success( "Success", `Staff details for ${staffData.name} updated.` )
        setIsUpdating(false)
    }
    
    const handlePasswordReset = async () => {
        if (!staffData) return;
        setIsUpdating(true)
        await new Promise(resolve => setTimeout(resolve, 1500))
        toast.info("Security", `Password reset to temporary default (e.g., 123456).` )
        setIsUpdating(false)
    }

    if (loading) {
        return <Card><CardContent className="py-8 text-center text-muted-foreground">Staff account not found for ID: {staffId}</CardContent></Card>
    }

    if (!staffData) {
        return <Card><CardContent className="py-8 text-center text-muted-foreground">Staff account not found for ID: {staffId}</CardContent></Card>
    }

    return (
        <div className="space-y-6">
            {/* UPDATED: Breadcrumb Navigation */}
            <div className="flex items-center justify-between">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/portal">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/portal/staff-management">Staff Management</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>Staff Details ({staffId})</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* 1. General Information Card (Read-Only) */}
            <Card>
                <CardContent>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
                        <User className="h-6 w-6 text-primary" />
                        {staffData.name} <StatusBadge status={staffData.status} />
                    </h3>
                    <div className="grid grid-cols-2 gap-x-8 gap-y-4 p-4 bg-muted/50 rounded-lg">
                        <div>
                            <div className="text-sm text-muted-foreground">Staff ID</div>
                            <div className="font-medium">{staffData.id}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Email (Login ID)</div>
                            <div className="font-medium">{staffData.email}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Department</div>
                            <div className="font-medium">{staffData.department}</div>
                        </div>
                        <div>
                            <div className="text-sm text-muted-foreground">Account Created</div>
                            <div className="font-medium">{staffData.createdDate}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            {/* 2. Role & Status Management Card (Editable) */}
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                        Role and Status Management
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="role-select">New Role / Access Level</Label>
                            <Select onValueChange={setNewRole} value={newRole}>
                              <SelectTrigger id="role-select"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 {mockRoles.map(role => (<SelectItem key={role} value={role}>{role}</SelectItem>))}
                              </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status-select">Account Status</Label>
                            <Select onValueChange={setNewStatus} value={newStatus}>
                              <SelectTrigger id="status-select"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                 <SelectItem value="Active">Active</SelectItem>
                                 <SelectItem value="Inactive">Inactive</SelectItem>
                                 <SelectItem value="Suspended">Suspended</SelectItem>
                              </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-2 pt-4">
                            <Button onClick={handleUpdate} disabled={isUpdating} className="w-full">
                                {isUpdating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving Changes...</> : "Apply Role/Status Changes"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Password Reset Card */}
            <Card>
                <CardContent>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                         <Key className="h-5 w-5 text-muted-foreground" />
                        Security Actions
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-red-50/50 dark:bg-red-900/10">
                            <div className="space-y-1">
                                <p className="font-medium">Reset Password</p>
                                <p className="text-sm text-muted-foreground">Resets the staff member's password to a temporary default.</p>
                            </div>
                            <Button variant="destructive" onClick={handlePasswordReset} disabled={isUpdating} className="shrink-0">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                {isUpdating ? "Resetting..." : "Reset Now"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}