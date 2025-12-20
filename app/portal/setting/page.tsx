"use client"

import { useState } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { User, Mail, Phone, Building, Shield, Bell, Info, AlertTriangle, CheckCircle2, XCircle, Calendar, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAuth } from "@/hooks/use-auth"
import { canViewPackageManagement, canViewThemeParkSupport, canCreatePackage, isFinanceApprover } from "@/lib/auth"

// --- MOCK USER DATA (For display only) ---
const USER_META = {
    joinedDate: "15 Jan 2023",
    lastLogin: "Today, 10:42 AM"
}

export default function SettingsPage() {
  const { toast } = useToast()
  const { user } = useAuth()
  
  // Default preferences
  const [preferences, setPreferences] = useState({
      packageUpdates: true, 
      systemAnnouncements: false, 
  })

  const handleToggle = (key: keyof typeof preferences) => {
      const newValue = !preferences[key];
      setPreferences(prev => ({...prev, [key]: newValue}));
      toast({ title: "Preference Saved", description: "Notification setting updated." })
  }

  // --- PERMISSION CHECKS ---
  const permissions = [
      { label: "View Package Management", allowed: canViewPackageManagement(user?.department) },
      { label: "Create/Draft Packages", allowed: canCreatePackage(user?.department) },
      { label: "Approve/Reject Packages", allowed: isFinanceApprover(user?.department) },
      { label: "View Themepark Support", allowed: canViewThemeParkSupport(user?.department) },
  ];

  // Determine if user should see package alerts (MIS/TP/Finance)
  const showPackageAlerts = user?.department 
    ? ["MIS", "TP", "FINANCE"].some(d => user.department.toUpperCase().includes(d))
    : true;

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings" 
        description="View your profile details, permissions, and system preferences.(hardcoded)" 
      />

      <div className="grid gap-6 lg:grid-cols-3">
        
        {/* === LEFT COLUMN: PROFILE === */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Profile Information</CardTitle>
                    <CardDescription>Your account details from i-City SuperApp.</CardDescription>
                </div>
                <StatusBadge status="Synced" colorMap={{ synced: "bg-blue-100 text-blue-700 border-blue-200" }} />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <Alert className="bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-900/20 dark:text-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold">Profile Locked</AlertTitle>
                <AlertDescription className="text-amber-800/90 dark:text-amber-200/90 text-xs leading-relaxed">
                    To protect your SuperApp access (Parking, Office Entry), profile editing is disabled here. 
                    Please contact HR or use the SuperApp to update your details.
                </AlertDescription>
            </Alert>

            {/* PROFILE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-muted/30 rounded-lg border border-border/50">
                
                {/* ID */}
                <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="h-3 w-3" /> User ID
                    </div>
                    <div className="font-mono text-sm font-medium text-foreground pl-5">{user?.id || "N/A"}</div>
                </div>
                
                {/* Name */}
                <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="h-3 w-3" /> Full Name
                    </div>
                    <div className="text-sm font-medium text-foreground pl-5">{user?.name || "N/A"}</div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="h-3 w-3" /> Email Address
                    </div>
                    <div className="text-sm font-medium text-foreground pl-5">{user?.email || "N/A"}</div>
                </div>

                {/* Role */}
                <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Building className="h-3 w-3" /> Department / Role
                    </div>
                    <div className="text-sm font-medium text-foreground pl-5">{user?.department || "N/A"} <span className="text-muted-foreground text-xs">({user?.role})</span></div>
                </div>

                {/* Date Created */}
                <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> Date Created
                    </div>
                    <div className="text-sm font-medium text-foreground pl-5">{USER_META.joinedDate}</div>
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Activity className="h-3 w-3" /> Account Status
                    </div>
                    <div className="pl-5">
                        <StatusBadge status="Active" />
                    </div>
                </div>

            </div>
          </CardContent>
        </Card>

        {/* === RIGHT COLUMN: PREFERENCES & PERMISSIONS === */}
        <div className="space-y-6">
            
            {/* 1. Notifications */}
            <Card>
                <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {showPackageAlerts && (
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-medium flex items-center gap-2">
                                <Bell className="h-4 w-4 text-muted-foreground" /> Package Updates
                            </Label>
                            <Switch checked={preferences.packageUpdates} onCheckedChange={() => handleToggle('packageUpdates')} />
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium flex items-center gap-2">
                            <Info className="h-4 w-4 text-muted-foreground" /> System News
                        </Label>
                        <Switch checked={preferences.systemAnnouncements} onCheckedChange={() => handleToggle('systemAnnouncements')} />
                    </div>
                </CardContent>
            </Card>

            {/* 2. My Access Rights (Visual Checklist) */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-indigo-600" /> My Access Rights
                    </CardTitle>
                    <CardDescription>Based on your department: <span className="font-semibold text-foreground">{user?.department}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {permissions.map((perm, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <span className="text-muted-foreground">{perm.label}</span>
                            {perm.allowed ? (
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                            ) : (
                                <XCircle className="h-4 w-4 text-muted-foreground/30" />
                            )}
                        </div>
                    ))}
                </CardContent>
                <CardFooter className="bg-muted/30 border-t p-3">
                    <p className="text-[10px] text-center w-full text-muted-foreground">
                        Need more access? Contact MIS.
                    </p>
                </CardFooter>
            </Card>

        </div>
      </div>
    </div>
  )
}