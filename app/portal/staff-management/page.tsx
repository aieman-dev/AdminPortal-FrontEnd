"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, Shield, ShieldAlert } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Modals & Drawers
import { StaffAccountModal } from "@/components/modules/staff-management/StaffAccountModal" 
import { StaffDrawer } from "@/components/modules/staff-management/StaffDrawer" 
import { ActivityDrawer } from "@/components/modules/staff-management/ActivityDrawer" 

// New Modular Tabs
import StaffDirectoryTab from "@/components/modules/staff-management/tabs/StaffDirectoryTab"
import ActivityAuditTab from "@/components/modules/staff-management/tabs/ActivityAuditTab"

// Types
import { type StaffMember, type AuditLog } from "@/type/staff"
import { useAuth } from "@/hooks/use-auth" 
import { ROLES } from "@/lib/constants"
import { EmptyState } from "@/components/portal/empty-state"

export default function UsersStaffManagementPage() {
  const router = useRouter()
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const activeTab = searchParams.get("tab") || "staff"

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [refreshKey, setRefreshKey] = useState(0);

  const isAllowed = user?.department === ROLES.MIS_SUPER;

  // Optional: Redirect automatically
  useEffect(() => {
    if (user && !isAllowed) {
        // router.push("/portal"); // Uncomment to auto-redirect
    }
  }, [user, isAllowed, router]);

  // Show "Access Denied" if not allowed
  if (!isAllowed) {
      return (
        <div className="h-[60vh] flex items-center justify-center">
            <EmptyState 
                icon={ShieldAlert} 
                title="Access Denied" 
                description="You do not have permission to view Staff Management." 
                action={{ label: "Go to Dashboard", onClick: () => router.push("/portal") }}
            />
        </div>
      );
  }

  const handleTabChange = (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", value)
      router.replace(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-6">
      <PageHeader 
          title="Staff Management" 
          description="Manage system access and monitor user activities."
      >
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Role
        </Button>
      </PageHeader>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="directory" className="gap-2">
                <Users className="h-4 w-4" /> Staff Directory
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
                <Shield className="h-4 w-4" /> Activity Audit
            </TabsTrigger>
        </TabsList>

        <TabsContent value="directory" className="animate-in fade-in-50 duration-300 mt-0">
            <StaffDirectoryTab 
                refreshTrigger={refreshKey} 
                onRowClick={(staff) => {
                    setSelectedStaff(staff);
                    setIsDrawerOpen(true);
                }} 
            />
        </TabsContent>

        <TabsContent value="audit" className="animate-in fade-in-50 duration-300 mt-0">
            <ActivityAuditTab onRowClick={(log) => {
                setSelectedLog(log);
                setIsActivityDrawerOpen(true);
            }} />
        </TabsContent>
      </Tabs>

      {/* DRAWERS & MODALS  */}
      <StaffAccountModal 
          isOpen={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen}
          onSuccess={() => setRefreshKey(k => k + 1)}
          initialData={null} 
      />

      <StaffDrawer 
          isOpen={isDrawerOpen}
          staff={selectedStaff}
          onClose={() => setIsDrawerOpen(false)} 
          onUpdate={() => setRefreshKey(k => k + 1)}
      />

      <ActivityDrawer
          isOpen={isActivityDrawerOpen}
          log={selectedLog}
          onClose={() => setIsActivityDrawerOpen(false)}
      />
    </div>
  )
}