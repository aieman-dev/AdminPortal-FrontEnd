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

// Services & Types
import { carParkService } from "@/services/car-park-services" 
import { CarParkPass } from "@/type/car-park" 

// Components
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { type TableColumn, DataTable } from "@/components/themepark-support/it-poswf/data-table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"

const LOCAL_STORAGE_KEY = 'superAppVisitorSearch';

export default function SuperAppVisitor() {
  const toast = useAppToast()
  const router = useRouter()
  const pagination = usePagination({ pageSize: 20 });

  // --- State ---
  const [data, setData] = useState<CarParkPass[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Initialize search from local storage
  const [searchTerm, setSearchTerm] = useState(() => {
      if (typeof window !== 'undefined') {
        return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
      }
      return "";
  });

  // --- Main Fetch Logic ---
  // Handles both initial load, search, and pagination
  const fetchData = useCallback(async (page: number, query: string) => {
    setIsSearching(true)
    
    // Sync pagination state if triggered manually
    if (page !== pagination.currentPage) pagination.setCurrentPage(page);

    try {
      // Use getQrListing to ensure we get qrId and parking status
      const { items, totalCount, totalPages } = await carParkService.getQrListing(page, pagination.pageSize, query)

      setData(items)
      pagination.setMetaData(totalPages, totalCount)

      if (page === 1 && items.length > 0) {
         toast.info("Search Complete", `Found ${totalCount} records.`)
      }
    } catch (error) {
      console.error("Search Error:", error)
      setData([])
      toast.error("Network Error", "Failed to connect to service.")
    } finally {
      setIsSearching(false)
    }
  }, [pagination.pageSize ]) 

  // Auto-search hook
  useAutoSearch((query) => {
      setSearchTerm(query);
      fetchData(1, query);
  });

  // Persist search term
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_STORAGE_KEY, searchTerm);
    }
  }, [searchTerm]);
  
  // Initial Load (Manual trigger if auto-search doesn't fire immediately)
  useEffect(() => {
      fetchData(1, searchTerm);
  }, []);

  const handleSearchClick = () => {
     fetchData(1, searchTerm.trim());
  }

  // --- Navigation ---
  const handleEdit = (item: CarParkPass) => {
      // Navigate to the SuperApp Visitor details page
      router.push(`/portal/car-park/superapp-visitor/${item.qrId}?accId=${item.accId}`);
  }

  // --- Columns ---
  const columns: TableColumn<CarParkPass>[] = useMemo(() => [
    { 
        header: "Acc ID", 
        accessor: "accId", 
        className: "pl-6 font-medium w-[100px]" 
    },
    { 
        header: "Name", 
        accessor: "name"
    },
    { 
        header: "Email", 
        accessor: "email" 
    },
    { 
        header: "Status", 
        accessor: "status", 
        cell: (value) => <StatusBadge status={value as string} /> 
    },
    {
        header: "Action",
        accessor: "accId",
        className: "text-right pr-6",
        cell: (_: any, row: CarParkPass) => (
            <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Edit
            </Button>
        ),
    },
  ], []);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">SuperApp Visitor</h2>
        <p className="text-muted-foreground">
          Manage SuperApp visitor accounts, check status, and update details.
        </p>
      </div>

      <Card>
        <CardContent>
          <div>
            <SearchField 
                label="Search Account"
                placeholder="Search by Email"
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearchClick}
                isSearching={isSearching}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            data={data}
            keyExtractor={(row) => row.qrId.toString()}
            isLoading={isSearching}
            emptyTitle="No Records Found"
            emptyIcon={Users}
            emptyMessage={
                isSearching 
                ? "Searching..." 
                : searchTerm 
                    ? `No records found matching "${searchTerm}"`
                    : "Enter a keyword to search."
            }
            pagination={{
                ...pagination.paginationProps,
                onPageChange: (newPage) => fetchData(newPage, searchTerm) 
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}