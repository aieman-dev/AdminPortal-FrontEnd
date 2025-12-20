"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { Pencil, UserPlus, Users, SearchX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StaffAccountModal } from "@/components/staff-management/StaffAccountModal" 
import { useRouter } from "next/navigation" 
import { formatDate } from "@/lib/formatter";
import { staffService } from "@/services/staff-services"
import { type StaffMember } from "@/type/staff"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"


export default function UsersStaffManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [accounts, setAccounts] = useState<StaffMember[]>([]) 
  const [isSearching, setIsSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchStaff = useCallback(async (query: string = "") => {
    setIsSearching(true);
    if (query) setAccounts([]); 
    
    try {
      const data = await staffService.getStaffList(query);
      setAccounts(data);
      
      if (query && data.length === 0) {
        toast({ title: "Search Complete", description: "No staff found." });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ 
        title: "Error", 
        description: "Failed to load staff list.", 
        variant: "destructive" 
      });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleSearch = () => {
    fetchStaff(searchQuery);
  }

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  }
  
  const handleEdit = (user: StaffMember) => {
    router.push(`/portal/staff-management/${user.accId}`); 
  }
  
  const handleModalClose = () => {
      setIsModalOpen(false);
  }
  
  const handleCreationSuccess = () => {
      fetchStaff(searchQuery); 
  }

  const columns: TableColumn<StaffMember>[] = [
      { header: "Staff ID", accessor: "accId", className: "font-medium pl-6" },
      { header: "Name", accessor: "fullName", cell: (val) => val || "-" },
      { header: "Email (Login)", accessor: "email" },
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
          header: "Status", 
          accessor: "status", 
          className: "text-center",
          cell: (value) => <StatusBadge status={value} /> 
      },
      { header: "Created Date", accessor: "createdDate", cell: (val) => <span className="text-muted-foreground text-sm">{formatDate(val as string)}</span> },
      {
          header: "Action",
          accessor: "accId",
          className: "text-right",
          cell: (_, row) => (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )
      }
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
          title="Staff User Management" 
          description="Manage access and details for internal system staff accounts."
      >
        <Button onClick={handleOpenCreateModal}>
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
                emptyIcon={Users}
                emptyTitle="No Staff Found"
                emptyMessage="No staff members found. Try adjusting your search."
            />
        </CardContent>
      </Card>
      
      <StaffAccountModal 
          isOpen={isModalOpen} 
          onOpenChange={handleModalClose}
          onSuccess={handleCreationSuccess}
          initialData={null} 
      />
    </div>
  )
}