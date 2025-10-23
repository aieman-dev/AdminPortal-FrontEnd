"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchField } from "@/components/it-poswf/search-field"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { mockAccountData } from "@/lib/mock-data/it-poswf"
import { Pencil } from "lucide-react"

export default function AccountManagementPage() {
  const router = useRouter()
  const [searchEmail, setSearchEmail] = useState("")
  const [accounts, setAccounts] = useState(mockAccountData)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    setIsSearching(true)
    setTimeout(() => {
      if (searchEmail) {
        const filtered = mockAccountData.filter((account) =>
          account.email.toLowerCase().includes(searchEmail.toLowerCase()),
        )
        setAccounts(filtered)
      } else {
        setAccounts(mockAccountData)
      }
      setIsSearching(false)
    }, 500)
  }

  const handleEdit = (accountId: string) => {
    router.push(`/portal/it-poswf/account-management/${accountId}`)
  }

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardContent>
          <SearchField
            label="Email"
            placeholder="Enter email address"
            value={searchEmail}
            onChange={setSearchEmail}
            onSearch={handleSearch}
            isSearching={isSearching}
          />
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acc ID</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Mobile No</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No accounts found
                    </TableCell>
                  </TableRow>
                ) : (
                  accounts.map((account) => (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.accId}</TableCell>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>{account.firstName}</TableCell>
                      <TableCell>{account.mobile}</TableCell>
                      <TableCell>{account.createdDate}</TableCell>
                      <TableCell>
                        <StatusBadge status={account.accountStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(account.id)}>
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
    </div>
  )
}
