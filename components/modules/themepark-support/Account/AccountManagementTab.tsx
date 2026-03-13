// components/themepark-support/tabs/Account/AccountManagementTab.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react" 
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { Skeleton } from "@/components/ui/skeleton";
import { Pencil, Users } from "lucide-react"
import { itPoswfService } from "@/services/themepark-support" 
import { Account } from "@/type/themepark-support" 
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { formatDate, getAccountAge } from "@/lib/formatter"

const LOCAL_STORAGE_KEY = 'accountMasterEmailSearch';

export default function AccountManagementTab() {
  const router = useRouter()
  const toast  = useAppToast()

  // 1. Initialize state by reading from localStorage on mount
  const [searchEmail, setSearchEmail] = useState("");
  
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // 2. SEARCH LOGIC (Memoized)
  const executeSearch = useCallback(async (query: string) => {
    if (!query) {
        setAccounts([]);
        return;
    }

    setSearchEmail(query);
    setIsSearching(true)

    try {
      const response = await itPoswfService.searchAccounts(query)

      if (response.success && response.data) {
        setAccounts(response.data)
        if (response.data.length === 0) {
          toast.info("Search Complete", "No accounts found matching the search criteria." )
        }
      } else {
        setAccounts([])
        toast.error("Search Failed", response.error || "Could not retrieve account list.")
      }
    } catch (error) {
      console.error("Account Search Error:", error)
      setAccounts([])
      toast.error("Network Error", "Failed to connect to the account search service.")
    } finally {
      setIsSearching(false)
    }
  }, [])


  //  Restore from Storage & Fetch on Mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || "";
    
    if (saved) {
        setSearchEmail(saved);
        executeSearch(saved);
    }
  }, [executeSearch]);
  
  // 3. AUTO SEARCH HOOK (Replaces the complex useEffect)
  useAutoSearch(executeSearch);

  // 4. PERSISTENCE EFFECT (Save to LocalStorage when user types)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, searchEmail);
    }
  }, [searchEmail]);

  // 5. MANUAL SEARCH TRIGGER
  const handleSearchClick = () => {
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
    { header: "Created Date", accessor: "createdDate", cell: (val) => <span className="text-muted-foreground">{formatDate(val as string)}</span> },
    { 
        header: "Account Age", 
        accessor: "createdDate", 
        cell: (val) => <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-1 rounded">{getAccountAge(val as string)}</span> 
    },
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
            onSearch={handleSearchClick} 
            isSearching={isSearching}
            inputType="email"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
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