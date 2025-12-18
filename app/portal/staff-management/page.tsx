// app/portal/page-3/page.tsx (Final Update)

"use client"

import { useState } from "react"
import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { UserPlus, Pencil, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { StaffAccountModal } from "@/components/staff-management/StaffAccountModal" 
import { useRouter } from "next/navigation" 

// --- MOCK STAFF DATA ---
interface StaffAccount {
    id: string
    name: string
    email: string
    department: string
    role: string
    status: "Active" | "Inactive" | "Suspended"
    createdDate: string
}

const mockStaff: StaffAccount[] = [
    { id: "1", name: "Asy", email: "IT_Admin@email.my", department: "IT", role: "IT Admin", status: "Active", createdDate: "2024-01-01" },
    { id: "2", name: "Aimeen", email: "MIS_Super@email.my", department: "MIS", role: "Super Admin", status: "Active", createdDate: "2024-05-10" },
    { id: "3", name: "Bob Tan", email: "Finance@email.my", department: "Finance", role: "Package Approval", status: "Inactive", createdDate: "2024-07-22" },
    { id: "4", name: "Alice Lee", email: "Tp@email.my", department: "Theme Park", role: "Package Creation", status: "Active", createdDate: "2024-11-01" },
]

export default function UsersStaffManagementPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [accounts, setAccounts] = useState<StaffAccount[]>(mockStaff)
  const [isSearching, setIsSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { toast } = useToast()

  const handleSearch = async () => {
    const query = searchQuery.trim().toLowerCase()
    setIsSearching(true)
    
    const filtered = mockStaff.filter(acc => 
        acc.email.toLowerCase().includes(query) || 
        acc.name.toLowerCase().includes(query) ||
        acc.department.toLowerCase().includes(query)
    )
    
    await new Promise(resolve => setTimeout(resolve, 500)) 
    setAccounts(filtered)
    setIsSearching(false)

    if (filtered.length === 0) {
      toast({
        title: "Search Complete",
        description: "No staff accounts found matching the criteria.",
      })
    }
  }

  const handleOpenCreateModal = () => {
    setIsModalOpen(true);
  }
  
  // CRITICAL CHANGE: Navigate to the dedicated edit page
  const handleEdit = (user: StaffAccount) => {
    router.push(`/portal/staff-management/${user.id}`); 
  }
  
  const handleModalClose = () => {
      setIsModalOpen(false);
  }
  
  const handleCreationSuccess = () => {
      toast({
          title: "Account Created",
          description: `New staff account successfully created.`,
      })
  }

  return (
    <div className="space-y-6">
      <PageHeader 
          title="Staff User Management" 
          description="Search for existing users and assign administrative roles."
      >
        <Button onClick={handleOpenCreateModal}>
          <UserPlus className="h-4 w-4 mr-2" />
          Assign Role to User
        </Button>
      </PageHeader>

      <Card>
        <CardContent>
          <SearchField
            label="Name / Email / Department"
            placeholder="Search by name, email, or department"
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
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 && !isSearching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No staff accounts found.
                    </TableCell>
                  </TableRow>
                  ) : isSearching ? (
                  <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Searching staff accounts...
                        </TableCell>
                    </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.id}</TableCell>
                      <TableCell>{account.name}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.department}</TableCell>
                      <TableCell>{account.role}</TableCell>
                      <TableCell>
                        <StatusBadge status={account.status} />
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
      
      {/* The Modal Component is now only used for creation */}
      <StaffAccountModal 
          isOpen={isModalOpen} 
          onOpenChange={handleModalClose}
          onSuccess={handleCreationSuccess}
          initialData={null}
      />
    </div>
  )
}