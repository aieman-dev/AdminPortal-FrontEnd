"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input" 
import { Textarea } from "@/components/ui/textarea" 
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { 
    User, Mail, Building, Shield, Bell, Info, 
    AlertTriangle, CheckCircle2, XCircle, Calendar, 
    Activity, Loader2, Megaphone, Send
} from "lucide-react"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAuth } from "@/hooks/use-auth"
import { canViewPackageManagement, canViewThemeParkSupport, canCreatePackage, isFinanceApprover, canViewCarParkSupport, canViewHRSupport } from "@/lib/auth"
import { staffService } from "@/services/staff-services" 
import { StaffMember } from "@/type/staff" 
import { formatDate } from "@/lib/formatter"
import { settingService, BroadcastPayload } from "@/services/setting-services"
import { ROLES } from "@/lib/constants"
import ExpirySelector, { ExpiryData } from "@/components/portal/ExpirySelector"

export default function SettingsPage() {
  const  toast = useAppToast()
  const { user } = useAuth()

  // --- PROFILE STATE ---
  const [profile, setProfile] = useState<StaffMember | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [preferences, setPreferences] = useState({
      packageUpdates: false, 
      systemAnnouncements: false, 
  })

  // --- BROADCAST STATE ---
  const [broadcastForm, setBroadcastForm] = useState<{
      title: string;
      message: string;
      type: "info" | "warning" | "critical" | "";
      expiryDate: Date | undefined;
  }>({
      title: "",
      message: "",
      type: "", 
      expiryDate: undefined
  });

  
  const [isPosting, setIsPosting] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProfile = async () => {
        if (!user?.email) return;
        try {
            setIsLoading(true);
            const myProfile = await staffService.getMe();
            setProfile(myProfile);

            const globalStatus = myProfile.receiveNotifications ?? true;
            setPreferences({
                packageUpdates: globalStatus,
                systemAnnouncements: globalStatus
            });

        } catch (error) {
            console.error("Failed to load profile:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchProfile();
  }, [user]);

  // --- HANDLERS ---
  const handleToggle = async (checked: boolean) => {
      setPreferences({
          packageUpdates: checked,
          systemAnnouncements: checked
      });

      try {
              await settingService.toggleGlobalNotifications(checked);
          
          toast.info( "Saved", `Global notifications turned ${checked ? 'ON' : 'OFF'}.` );
      } catch (error) {
          setPreferences({
              packageUpdates: !checked,
              systemAnnouncements: !checked
          });
          toast.error( "Save Failed", "Could not save your preference. Please try again.");
      }
  }

  const handlePostBroadcast = async () => {
      if (!broadcastForm.title.trim()) {
          toast.error("Missing Title", "Please enter a title.");
          return;
      }
      if (!broadcastForm.type) {
          toast.error( "Missing Type", "Please select a severity type.");
          return;
      }
      if (!broadcastForm.message.trim()) {
          toast.error( "Missing Message",  "Please enter message content.");
          return;
      }
      if (!broadcastForm.expiryDate) {
          toast.error( "Missing Expiry", "Please select an expiry date.");
          return;
      }
      if (broadcastForm.expiryDate < new Date()) {
           toast.error("Invalid Date",  "Expiry date must be in the future.");
           return;
      }

      setIsPosting(true);

      try {
          const isoExpiry = broadcastForm.expiryDate.toISOString(); 

          const payload: BroadcastPayload = {
              title: broadcastForm.title,
              message: broadcastForm.message,
              type: broadcastForm.type as "info" | "warning" | "critical",
              expirydate: isoExpiry 
          };

          await settingService.createBroadcast(payload);
          
          toast.success("Broadcast Sent",  "System announcement created successfully.");
          
          setBroadcastForm({
              title: "",
              message: "",
              type: "",
              expiryDate: undefined
          });

      } catch (error) {
          toast.error( "Post Failed", error instanceof Error ? error.message : "Could not send broadcast.");
      } finally {
          setIsPosting(false);
      }
  }

  // --- PERMISSIONS LOGIC ---
  const permissions = [
      { label: "View Package Management", allowed: canViewPackageManagement(user?.department) },
      { label: "Create/Draft Packages", allowed: canCreatePackage(user?.department) },
      { label: "Approve/Reject Packages", allowed: isFinanceApprover(user?.department) },
      { label: "View Themepark Support", allowed: canViewThemeParkSupport(user?.department) },
      { label: "View Car Park Management", allowed: canViewCarParkSupport(user?.department) },
      { label: "View HR Management", allowed: canViewHRSupport(user?.department) },
  ];

  const showPackageAlerts = user?.department 
    ? ["MIS","IT", "TP", "FINANCE"].some(d => user.department.toUpperCase().includes(d))
    : true;

  const isSuperAdmin = user?.department === ROLES.MIS_SUPER;

  const getPreviewStyles = (type: string) => {
      switch(type) {
          case 'warning': return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300";
          case 'critical': return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300";
          case 'info': return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300";
          default: return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800/50 dark:text-gray-300";
      }
  };

  const getBroadcastIcon = (type: string) => {
      const t = type.toLowerCase();
      if (t === 'critical') return <XCircle className="h-4 w-4" />;
      if (t === 'warning') return <AlertTriangle className="h-4 w-4" />;
      return <Info className="h-4 w-4" />; // Default to Info
  };

  const handleExpiryUpdate = useCallback((data: ExpiryData) => {
    const newDate = new Date(data.isoString);
    
    setBroadcastForm(prev => {
        if (prev.expiryDate?.getTime() === newDate.getTime()) {
            return prev;
        }
        return { ...prev, expiryDate: newDate };
    });
  }, []);

  return (
    <div className="space-y-4 pb-20 md:pb-0">
      <PageHeader 
        title="Settings" 
        description="View your profile details, permissions, and system preferences." 
      />

      <Tabs defaultValue="account" className="space-y-3">
        
        <div className="w-full overflow-x-auto scrollbar-hide pb-1">
            <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-auto">
                <TabsTrigger 
                    value="account" 
                    className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 min-w-[140px]">
                    <User className="h-4 w-4" /> My Account
                </TabsTrigger>
                
                {isSuperAdmin && (
                    <TabsTrigger 
                        value="system" 
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 min-w-[180px]">
                        <Megaphone className="h-4 w-4" /> System Announcement
                    </TabsTrigger>
                )}
            </TabsList>
        </div>

        {/* === TAB 1: MY ACCOUNT === */}
        <TabsContent value="account" className="space-y-3 animate-in fade-in-50 duration-300">
            <div className="grid gap-4 lg:grid-cols-3 items-stretch">
                
                {/* Left Column: Profile */}
                <div className="lg:col-span-2 flex flex-col">
                     <Card className="h-full flex flex-col">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Profile Information</CardTitle>
                                    <CardDescription>Your account details from i-City SuperApp.</CardDescription>
                                </div>
                                <StatusBadge status="Synced" colorMap={{ synced: "bg-blue-100 text-blue-700 border-blue-200" }} />
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 p-5 bg-muted/30 rounded-lg border border-border/50 h-fit content-start">
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Shield className="h-3 w-3" /> User ID</div>
                                    <div className="font-mono text-sm font-medium text-foreground pl-5 h-5 flex items-center">{isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (profile?.accId || user?.id || "N/A")}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><User className="h-3 w-3" /> Full Name</div>
                                    <div className="text-sm font-medium text-foreground pl-5 h-5 flex items-center">{isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (profile?.fullName || user?.name || "N/A")}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Mail className="h-3 w-3" /> Email Address</div>
                                    <div className="text-sm font-medium text-foreground pl-5 h-5 flex items-center">{isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (profile?.email || user?.email || "N/A")}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Building className="h-3 w-3" /> System Role</div>
                                    <div className="text-sm font-medium text-foreground pl-5 h-5 flex items-center">{isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : (profile?.roleName || user?.department || "N/A")}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Date Created</div>
                                    <div className="text-sm font-medium text-foreground pl-5 h-5 flex items-center">{isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : formatDate(profile?.createdDate)}</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"><Activity className="h-3 w-3" /> Account Status</div>
                                    <div className="pl-5 h-5 flex items-center">{isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <StatusBadge status={profile?.status || "Unknown"} />}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Notifications & Permissions */}
                <div className="space-y-3 flex flex-col h-full"> 
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Notifications</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {showPackageAlerts && (
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-medium flex items-center gap-2">
                                        <Bell className="h-4 w-4 text-muted-foreground" /> Package Updates
                                    </Label>
                                    <Switch checked={preferences.packageUpdates} onCheckedChange={handleToggle} />
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-medium flex items-center gap-2">
                                    <Info className="h-4 w-4 text-muted-foreground" /> System News
                                </Label>
                                <Switch checked={preferences.packageUpdates} onCheckedChange={handleToggle} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex-1 flex flex-col"> 
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2"><Shield className="h-4 w-4 text-indigo-600" /> My Access Rights</CardTitle>
                            <CardDescription>Based on: <span className="font-semibold text-foreground">{user?.department}</span></CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-1 flex-1"> 
                            {/* COMPACT: Reduced padding (py-1) to shave height */}
                            {permissions.map((perm, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm py-1 px-2 rounded-md hover:bg-muted/50 transition-colors">
                                    <span className="text-muted-foreground">{perm.label}</span>
                                    {perm.allowed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-muted-foreground/30" />}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </TabsContent>

       {/* === TAB 2: SYSTEM CONTROL (Modified for Compactness) === */}
        {isSuperAdmin && (
            <TabsContent value="system" className="space-y-4 animate-in fade-in-50 duration-300">
                <div className="grid gap-6 lg:grid-cols-12 items-start">
                    
                    <div className="lg:col-span-8 flex flex-col h-full">
                         <Card className="border-muted bg-card h-full flex flex-col shadow-sm">
                            <CardHeader className="pb-4 border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Megaphone className="h-5 w-5 text-indigo-600" /> Create Broadcast
                                </CardTitle>
                                <CardDescription>Post a new system-wide announcement.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <Label>Title <span className="text-red-500">*</span></Label>
                                        <Input 
                                            placeholder="e.g. System Maintenance" 
                                            value={broadcastForm.title}
                                            onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                                            className="h-11" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Severity Type <span className="text-red-500">*</span></Label>
                                        <Select 
                                            value={broadcastForm.type} 
                                            onValueChange={(val: any) => setBroadcastForm({ ...broadcastForm, type: val })}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="info">Info</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="critical">Critical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Message Content <span className="text-red-500">*</span></Label>
                                    <Textarea 
                                        placeholder="Enter the detailed announcement message..."
                                        className="min-h-[60px] resize-none text-sm" // Reduced height
                                        value={broadcastForm.message}
                                        onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <ExpirySelector onExpiryChange={handleExpiryUpdate} />
                                </div>

                                <div className="pt-4 flex justify-end mt-auto border-t">
                                    <Button 
                                        onClick={handlePostBroadcast} 
                                        disabled={isPosting} 
                                        className="w-full md:w-auto h-10 px-8"
                                    >
                                        {isPosting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />} 
                                        {isPosting ? "Broadcasting..." : "Send Broadcast"}
                                    </Button>
                                </div>

                            </CardContent>
                        </Card>
                    </div>
                    
                    {/* Preview Sidebar */}
                    <div className="lg:col-span-4 space-y-6 sticky top-6">
                         <Card>
                            <CardHeader className="pb-3 border-b"><CardTitle className="text-sm">Live Preview</CardTitle></CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className={`text-sm p-4 rounded-lg border shadow-sm ${getPreviewStyles(broadcastForm.type)}`}>
                                    <div className="font-bold flex items-center gap-2 mb-2">
                                        {getBroadcastIcon(broadcastForm.type)}
                                        {broadcastForm.title || "Announcement Title"}
                                    </div>
                                    <p className="opacity-90">{broadcastForm.message || "Message content will appear here..."}</p>
                                </div>
                                <div className="text-xs text-muted-foreground px-1">
                                    Preview of dashboard banner.
                                </div>
                            </CardContent>
                         </Card>
                    </div>
                </div>
            </TabsContent>
        )}
      </Tabs>
    </div>
  )
}