// app/portal/staff-management/page.tsx
"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { UserPlus, Users, Eye, ChevronRight, ArrowUpRight, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StaffAccountModal } from "@/components/staff-management/StaffAccountModal" 
import { ActivityCell } from "@/components/staff-management/ActivityCell"; // Import the new component
import { ActionType } from "@/type/activity-log"; 
import { StaffDrawer } from "@/components/staff-management/StaffDrawer" 
import { formatDate, getRelativeTime } from "@/lib/formatter";
import { staffService } from "@/services/staff-services"
import { type StaffMember, type ExtendedStaffMember } from "@/type/staff"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"

export default function UsersStaffManagementPage() {
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('search')
  
  const [searchQuery, setSearchQuery] = useState("")
  const [accounts, setAccounts] = useState<ExtendedStaffMember[]>([]) 
  const [isSearching, setIsSearching] = useState(false)
  
  // Modal States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  
  // Drawer States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null)

  const fetchStaff = useCallback(async (query: string = "") => {
    setIsSearching(true);
    if (query) setAccounts([]); 
    
    try {
      const data = await staffService.getStaffList(query);

      // --- MOCK DATA GENERATOR (Simulating Backend Activity Log) ---
      const enrichedData: ExtendedStaffMember[] = data.map((staff, index) => {
          const possibleActions: { desc: string; type: ActionType }[] = [
              { desc: "System Login", type: 'AUTH_LOGIN' },
              { desc: "Changed Password", type: 'AUTH_PASSWORD_CHANGE' },
              { desc: "Created 'Year End Promo'", type: 'PKG_CREATE' },
              { desc: "Approved 'Family Bundle'", type: 'PKG_APPROVE' },
              { desc: "Rejected 'Test Package'", type: 'PKG_REJECT' },
              { desc: "Voided Transaction #1092", type: 'TRX_VOID' },
              { desc: "Resynced Transaction #8821", type: 'TRX_RESYNC' },
              { desc: "Deactivated Ticket #T-7712", type: 'TICKET_DEACTIVATE' },
              { desc: "Manual Consume (SuperApp)", type: 'TRX_CONSUME' }
          ];

          const randomAction = possibleActions[(index + staff.accId) % possibleActions.length];

          const now = new Date();
          // Random time: between 1 minute and 2 days ago
          const minutesAgo = (index * 17) % (60 * 48); 
          now.setMinutes(now.getMinutes() - minutesAgo);

          return {
              ...staff,
              lastAction: {
                  description: randomAction.desc,
                  type: randomAction.type,
                  timestamp: now.toISOString()
              }
          };
      });

      // Sort by Most Recent Activity
      const sortedData = enrichedData.sort((a, b) => {
         const dateA = new Date(a.lastAction?.timestamp || 0).getTime();
         const dateB = new Date(b.lastAction?.timestamp || 0).getTime();
         return dateB - dateA; 
      });

      setAccounts(sortedData);
      
      if (query && data.length === 0) {
        toast({ title: "Search Complete", description: "No staff found." });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ title: "Error", description: "Failed to load staff list.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (urlQuery) {
        setSearchQuery(urlQuery);
        fetchStaff(urlQuery);
        window.history.replaceState(null, '', window.location.pathname);
    } else {
        fetchStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

  const handleSearch = () => fetchStaff(searchQuery);

  const handleViewDetails = (user: StaffMember) => {
      setSelectedStaff(user);
      setIsDrawerOpen(true);
  }

  const columns: TableColumn<ExtendedStaffMember>[] = [
      { header: "Staff ID", accessor: "accId", className: "font-medium pl-6" },
      { 
          header: "Name", 
          accessor: "fullName", 
          cell: (val, row) => (
            <button 
                onClick={() => handleViewDetails(row)}
                className="font-medium text-foreground hover:text-primary hover:underline text-left"
            >
                {val || "-"}
            </button>
          ) 
      },
      { header: "Email", accessor: "email" },
      { 
          header: "Role", 
          accessor: "roleName", 
          className: "text-center",
          cell: (value) => (
            <span className="inline-flex items-center justify-center w-[120px] h-6 rounded-md bg-blue-50 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-900/30 dark:text-blue-300 dark:ring-blue-700/30">
              {value}
            </span>
          )
      },
      { 
        header: "Recent Activity", 
        accessor: "lastAction", 
        className: "w-[240px]",
        cell: (val: any) => <ActivityCell activity={val} />
      },
      { 
          header: "Status", 
          accessor: "status", 
          className: "text-center",
          cell: (value) => <StatusBadge status={value} /> 
      },
      { header: "Created Date", accessor: "createdDate", cell: (val) => <span className="text-muted-foreground text-sm">{formatDate(val as string)}</span> },
      {
          header: "Action",
          accessor: "accId",
          className: "text-right pr-10",
          cell: (_, row) => (
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleViewDetails(row)}
                className="h-8 gap-1 text-muted-foreground hover:text-primary"
            >
              Details <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          )
      }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
          title="Staff User Management" 
          description="Manage access, roles, and audit activity logs for system staff."
      >
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Role to User
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <SearchField
            label="Search Staff"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={setSearchQuery}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
            <DataTable
                columns={columns}
                data={accounts}
                keyExtractor={(row) => String(row.accId)}
                isLoading={isSearching}
                onRowClick={handleViewDetails}
                emptyIcon={Users}
                emptyTitle="No Staff Found"
                emptyMessage="No staff members found. Try adjusting your search."
            />
        </CardContent>
      </Card>
      
      {/* 1. Create Modal */}
      <StaffAccountModal 
          isOpen={isCreateModalOpen} 
          onOpenChange={setIsCreateModalOpen}
          onSuccess={() => fetchStaff(searchQuery)}
          initialData={null} 
      />

      {/* 2. Side Drawer (The new feature) */}
      <StaffDrawer 
          isOpen={isDrawerOpen}
          staff={selectedStaff}
          onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
}