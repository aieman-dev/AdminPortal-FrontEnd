"use client"

import { useState, useEffect, useCallback } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { Pencil, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StaffAccountModal } from "@/components/staff-management/StaffAccountModal" 
import { useRouter } from "next/navigation" 
import { staffService, type StaffMember } from "@/services/staff-services"
import { Skeleton } from "@/components/ui/skeleton"

const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });
};

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
    router.push(`/portal/staff-management/${user.accID}`); 
  }
  
  const handleModalClose = () => {
      setIsModalOpen(false);
  }
  
  const handleCreationSuccess = () => {
      fetchStaff(searchQuery); 
  }

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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email (Login)</TableHead>
                  <TableHead className="w-[140px] text-center">Role</TableHead> {/* Centered Header */}
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isSearching ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                       <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                       <TableCell><Skeleton className="h-6 w-24 rounded-md mx-auto" /></TableCell>
                       <TableCell><Skeleton className="h-6 w-20 rounded-full mx-auto" /></TableCell>
                       <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                       <TableCell className="text-right"><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No staff records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.accID}>
                      <TableCell className="font-medium">{account.accID}</TableCell>
                      <TableCell>{account.fullName || "-"}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      
                      {/* FIX: Applied fixed width and centering to the Role Badge */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-[100px] h-6 rounded-md bg-blue-50 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {account.roleName}
                        </span>
                      </TableCell>
                      
                      <TableCell className="text-center">
                        <StatusBadge status={account.recordStatus} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(account.createdDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(account)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
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