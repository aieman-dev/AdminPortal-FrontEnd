"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, QrCode } from "lucide-react" 
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

const LOCAL_STORAGE_KEY = 'seasonParkingSearch';

export default function SeasonParkingPage() {
  const toast = useAppToast()
  const router = useRouter()
  const pagination = usePagination({ pageSize: 20 });

  // --- State ---
  // Standardized to 'data' to match SuperApp Visitor
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
  const fetchData = useCallback(async (page: number, query: string) => {
    setIsSearching(true)
    
    if (page !== pagination.currentPage) pagination.setCurrentPage(page);

    try {
      const { items, totalCount, totalPages } = await carParkService.getQrListing(page, pagination.pageSize, query.trim())

      setData(items)
      pagination.setMetaData(totalPages, totalCount)

      if (page === 1 && items.length > 0) {
         // Optional: toast.info("Search Complete", `Found ${totalCount} records.`)
      }
    } catch (error) {
      console.error("Search Error:", error)
      setData([])
      toast.error("Error", "Failed to fetch data.")
    } finally {
      setIsSearching(false)
    }
  }, [pagination.pageSize, toast]) 

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
  
  // Initial Load
  useEffect(() => {
      fetchData(1, searchTerm);
  }, []);

  const handleSearchClick = () => {
     fetchData(1, searchTerm);
  }

  // --- Navigation ---
  const handleEdit = (item: CarParkPass) => {
    router.push(`/portal/car-park/season-parking/${item.qrId}?accId=${item.accId}`);
  }

  // --- Columns (Specific to Season Parking) ---
  const columns: TableColumn<CarParkPass>[] = useMemo(() => [
    { 
        header: "QrID", 
        accessor: "qrId", 
        className: "pl-6 w-[80px]", 
        cell: (value) => <span className="font-medium text-muted-foreground">{value}</span> 
    },
    { 
        header: "Email", 
        accessor: "email",
        cell: (value) => <span className="font-medium">{value}</span>
    },
    { 
        header: "Staff No", 
        accessor: "staffNo",
        cell: (value) => value !== "-" 
            ? <Badge variant="secondary" className="font-normal">{value}</Badge> 
            : <span className="text-muted-foreground">-</span>
    },
    { 
        header: "Car Plate", 
        accessor: "plateNo", 
        cell: (value) => <span className="font-mono uppercase tracking-wide">{value}</span> 
    },
    { header: "Unit No", accessor: "unitNo" },
    { 
        header: "Season Package", 
        accessor: "packageName", 
        cell: (value) => <div className="max-w-xs truncate text-muted-foreground" title={value as string}>{value}</div> 
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
        <h2 className="text-3xl font-bold tracking-tight">Season Parking</h2>
        <p className="text-muted-foreground">
          Manage season pass, check validity status, and update user details.
        </p>
      </div>

      <Card>
        <CardContent>
          <div>
            <SearchField 
                label="Search Records"
                placeholder="Search by Email or Car Plate"
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
            emptyIcon={QrCode}
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