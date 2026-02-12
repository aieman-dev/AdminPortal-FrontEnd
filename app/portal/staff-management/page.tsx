"use client"

import { useState } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Button } from "@/components/ui/button"
import { UserPlus, Users, Shield } from "lucide-react"
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

export default function UsersStaffManagementPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  const [isActivityDrawerOpen, setIsActivityDrawerOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [refreshKey, setRefreshKey] = useState(0);

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

      <Tabs defaultValue="directory" className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
            <TabsTrigger value="directory" className="gap-2"><Users className="h-4 w-4" /> Staff Directory</TabsTrigger>
            <TabsTrigger value="audit" className="gap-2"><Shield className="h-4 w-4" /> Activity Audit</TabsTrigger>
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