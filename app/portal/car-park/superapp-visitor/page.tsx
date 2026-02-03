//  app/portal/car-park/superapp-visitor/page.tsx
"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pencil, Users } from "lucide-react" 
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { usePagination } from "@/hooks/use-pagination"
import { PageHeader } from "@/components/portal/page-header"

// Services & Types
import { carParkService } from "@/services/car-park-services" 
import { Account } from "@/type/car-park" 

// Components
import { StatusBadge } from "@/components/shared-components/status-badge"
import { type TableColumn, DataTable } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { formatDateTime } from "@/lib/formatter"

const LOCAL_STORAGE_KEY = 'superAppVisitorSearch';

export default function SuperAppVisitor() {
  const toast = useAppToast()
  const router = useRouter()
  const pagination = usePagination({ pageSize: 20 });

  // --- State ---
  const [data, setData] = useState<Account[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Initialize search from local storage
  const [searchTerm, setSearchTerm] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
      }
      return "";
  });

  // --- Main Fetch Logic ---
  const fetchData = useCallback(async (query: string) => {
    if (!query.trim()) {
        setData([]);
        return;
    }
    setIsSearching(true)
    try {
      const items = await carParkService.searchSuperAppAccounts(query.trim())
      setData(items)
      
      if (items.length > 0) {
         toast.info("Search Complete", `Found ${items.length} records.`)
      }
    } catch (error) {
      console.error("Search Error:", error)
      setData([])
      toast.error("Network Error", "Failed to connect to service.")
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Auto-search hook
  useAutoSearch((query) => {
      setSearchTerm(query);
      fetchData(query);
  });

  // Persist search term
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, searchTerm);
    }
  }, [searchTerm]);
  
  const handleSearchClick = () => {
     fetchData(searchTerm);
  }

  // --- Navigation ---
  const handleEdit = (item: any) => {
      router.push(`/portal/car-park/superapp-visitor/${item.accId}`);
  }

  // --- Columns ---
  const columns: TableColumn<Account>[] = useMemo(() => [
    { 
        header: "Acc ID", 
        accessor: "accId", 
        className: "pl-6 font-medium w-[100px]" 
    },
    { 
        header: "Name", 
        accessor: "firstName"
    },
    { 
        header: "Email", 
        accessor: "email" 
    },
    { 
        header: "Mobile No", 
        accessor: "mobile" 
    },
    { 
        header: "Status", 
        accessor: "accountStatus", 
        cell: (value) => <StatusBadge status={value as string} /> 
    },
    { 
        header: "Created Date", 
        accessor: "createdDate",
        cell: (value) => formatDateTime(value as string)
    },
    {
        header: "Action",
        accessor: "accId",
        className: "text-right pr-6",
        cell: (_: any, row: Account) => (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Edit
            </Button>
        ),
    },
  ], []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <PageHeader 
        title="SuperApp Visitor" 
        description="Manage SuperApp visitor accounts, check status, and update details." 
      />

      <Card>
        <CardContent>
            <SearchField 
                label="Search Account"
                placeholder="Search by Email"
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearchClick}
                isSearching={isSearching}
            />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={(row) => row.accId}
            isLoading={isSearching}
            emptyIcon={Users}
            emptyTitle="No Records Found"
            emptyMessage={
                  isSearching 
                  ? "Searching..." 
                  : searchTerm 
                      ? `No records found matching "${searchTerm}"`
                      : "Enter a keyword to search."
              }
          />
        </CardContent>
      </Card>
    </div>
  )
}