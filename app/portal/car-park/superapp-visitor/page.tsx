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
import { logger } from "@/lib/logger"

// Services & Types
import { carParkService } from "@/services/car-park-services" 
import { Account } from "@/type/car-park" 

// Components
import { StatusBadge } from "@/components/shared-components/status-badge"
import { type TableColumn, DataTable } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { formatDateTime } from "@/lib/formatter"
import { PullToRefresh } from "@/components/shared-components/pull-to-refresh"

const LOCAL_STORAGE_KEY = 'superAppVisitorSearch';

export default function SuperAppVisitor() {
  const toast = useAppToast()
  const router = useRouter()
  
  // --- State ---
  const [data, setData] = useState<Account[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Initialize search from local storage
  const [searchTerm, setSearchTerm] = useState("");

  //  Add refresh handler
  const handleRefresh = async () => {
      await fetchData(searchTerm);
  }

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
      logger.error("Search Error:", { error });
      setData([])
      toast.error("Network Error", "Failed to connect to service.")
    } finally {
      setIsSearching(false)
    }
  }, [])

  //  Restore & Fetch
  useEffect(() => {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || "";
      if (saved) {
          setSearchTerm(saved);
          fetchData(saved);
      }
  }, []);

  // Auto-search hook
  useAutoSearch((query) => {
      setSearchTerm(query);
      fetchData(query);
  });

  // Persist search term
  useEffect(() => {
      localStorage.setItem(LOCAL_STORAGE_KEY, searchTerm);
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
    <PullToRefresh onRefresh={handleRefresh}>
        <div className="space-y-6 min-h-screen">

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
                  inputType="email"
              />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
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
    </PullToRefresh>
  )
}