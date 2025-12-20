// components/themepark-support/tabs/Account/AccountManagementTab.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react" 
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Users } from "lucide-react"
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


  // 4. FIX: This useEffect now runs only ONCE on mount to load the previously saved 
  // email (if present), but crucially, it does NOT re-run on every keystroke, 
  // eliminating the lag.
  useEffect(() => {
    if (searchEmail) {
        // Trigger initial search only if a value was restored from localStorage
        executeSearch(searchEmail); 
    }
  }, [executeSearch]); // <-- Removed searchEmail from dependency array

  // Function used by the SearchField component (called on button click/Enter key)
  const handleSearchClick = () => {
    // CRITICAL FIX: Only trim and execute the search when the button is clicked.
    executeSearch(searchEmail.trim());
  }

  const handleEdit = (accountId: string) => {
    router.push(`/portal/themepark-support/account-master/${accountId}`) 
  }

  // Define Columns for the DataTable
  const accountColumns: TableColumn<Account>[] = useMemo(() => [
    { header: "Acc ID", accessor: "accId", className: "font-medium pl-6" },
    { header: "Email", accessor: "email" },
    { header: "First Name", accessor: "firstName" },
    { header: "Mobile No", accessor: "mobile" },
    { header: "Created Date", accessor: "createdDate" },
    { 
      header: "Status", 
      accessor: "accountStatus", 
      cell: (value) => <StatusBadge status={value} /> 
    },
    {
      header: "Action",
      accessor: "id",
      className: "text-right",
      cell: (id) => (
        <Button variant="ghost" size="sm" onClick={() => handleEdit(id)}>
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
      ),
    },
  ], []);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          {/* SearchField relies on handleSearchClick being the only trigger for a search */}
          <SearchField
            label="Email"
            placeholder="Enter email address"
            value={searchEmail}
            onChange={setSearchEmail}
            onSearch={handleSearchClick} // Calls the function that triggers the API call
            isSearching={isSearching}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <DataTable
            columns={accountColumns}
            data={accounts}
            keyExtractor={(account) => account.id}
            isLoading={isSearching}
            emptyIcon={Users}
            emptyTitle="No Accounts Found"
            emptyMessage={searchEmail ? `No results for "${searchEmail}"` : "Enter an email to search for accounts."}
          />
        </CardContent>
      </Card>
    </div>
  )
}