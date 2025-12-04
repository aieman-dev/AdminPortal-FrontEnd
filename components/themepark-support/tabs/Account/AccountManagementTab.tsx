// components/themepark-support/tabs/Account/AccountManagementTab.tsx
"use client"

import { useState, useEffect, useCallback } from "react" // Added useCallback
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { Pencil } from "lucide-react"
import { itPoswfService } from "@/services/themepark-support" 
import { Account } from "@/type/themepark-support" 
import { useToast } from "@/hooks/use-toast"

const LOCAL_STORAGE_KEY = 'accountMasterEmailSearch';

export default function AccountManagementTab() {
  const router = useRouter()
  const { toast } = useToast()

  // 1. Initialize state by reading from localStorage on mount
  const [searchEmail, setSearchEmail] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
    }
    return "";
  });
  
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 2. Persist state to localStorage whenever searchEmail changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, searchEmail);
    }
  }, [searchEmail]);


  // 3. Extracted and memoized the core search logic
  const executeSearch = useCallback(async (query: string) => {
    if (!query) {
        setAccounts([]);
        return;
    }

    setIsSearching(true)
    setAccounts([]) 

    try {
      const response = await itPoswfService.searchAccounts(query)

      if (response.success && response.data) {
        setAccounts(response.data)

        if (response.data.length === 0) {
          toast({
            title: "Search Complete",
            description: "No accounts found matching the search criteria.",
          })
        }
      } else {
        setAccounts([])
        toast({
          title: "Search Failed",
          description: response.error || "Could not retrieve account list.",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error("Account Search Error:", error)
      setAccounts([])
      toast({
        title: "Network Error",
        description: "Failed to connect to the account search service.",
        variant: "destructive"
      })
    } finally {
      setIsSearching(false)
    }
  }, [toast])


  // 4. CRITICAL FIX: Effect to run initial search if a saved email exists
  useEffect(() => {
    // Check if the initial state was populated from localStorage
    if (searchEmail) {
        executeSearch(searchEmail);
    }
  }, [executeSearch, searchEmail]); 

  // Function used by the SearchField component
  const handleSearchClick = () => {
    executeSearch(searchEmail.trim());
  }

  const handleEdit = (accountId: string) => {
    router.push(`/portal/themepark-support/account-master/${accountId}`) 
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <SearchField
            label="Email"
            placeholder="Enter email address"
            value={searchEmail}
            onChange={setSearchEmail}
            onSearch={handleSearchClick} // Calls the wrapper function
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
                {accounts.length === 0 && !isSearching ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No accounts found
                    </TableCell>
                  </TableRow>
                  ) : isSearching ? (
                  <TableRow>
                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            Loading accounts...
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