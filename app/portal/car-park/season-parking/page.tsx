"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Pencil, QrCode, Plus, MapPin, Clock, ChevronRight } from "lucide-react" 
import { Separator } from "@radix-ui/react-select"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { usePagination } from "@/hooks/use-pagination"
import { PageHeader } from "@/components/portal/page-header"
import { formatDate, formatDateTime } from "@/lib/formatter"
import { cn } from "@/lib/utils"

// Services & Types
import { carParkService } from "@/services/car-park-services" 
import { CarParkPass } from "@/type/car-park"
import { useAuth } from "@/hooks/use-auth"

// Components
import { StatusBadge } from "@/components/shared-components/status-badge"
import { type TableColumn, DataTable } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"

const LOCAL_STORAGE_KEY = 'seasonParkingSearch';

export default function SeasonParkingPage() {
  const toast = useAppToast()
  const router = useRouter()
  const { user } = useAuth()
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
        cell: (value, row: CarParkPass) => (
        <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger asChild>
                <span className="font-mono uppercase tracking-wide cursor-pointer hover:text-indigo-600 transition-colors">
                    {value}
                </span>
            </HoverCardTrigger>
            <HoverCardContent className="w-80 p-0 overflow-hidden border shadow-2xl pointer-events-auto">
                <div className="bg-muted/50 px-4 py-3 border-b">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Quick Information</span>
                        <Badge variant="outline" className="h-5 text-[9px] font-mono bg-background">ID: {row.qrId}</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-foreground">User: {row.name}</h4>
                </div>

                <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Unit No</p>
                            <p className="text-sm font-semibold">{row.unitNo || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold">Status</p>
                            <StatusBadge status={row.status} className="h-5 text-[9px]" />
                        </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-dashed mt-2">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Expiry Date</p>
                        <p className="text-sm font-semibold text-foreground">{formatDateTime(row.expiryDate)}</p>
                    </div>
                </div>

                {/* This button is now clickable because of closeDelay and pointer-events-auto */}
                <button 
                    onClick={() => router.push(`/portal/car-park/season-parking/${row.qrId}?accId=${row.accId}`)}
                    className="w-full bg-indigo-600 px-4 py-2 flex items-center justify-between text-white hover:bg-indigo-700 transition-colors"
                >
                    <span className="text-[10px] font-medium uppercase">Manage Account</span>
                    <ChevronRight className="h-3 w-3" />
                </button>
            </HoverCardContent>
        </HoverCard>
    )
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
      <PageHeader 
        title="Season Parking" 
        description="Manage season pass, check validity status, and update user details." 
      />

      <Card>
        <CardContent>
            <SearchField 
                label="Search Records"
                placeholder="Search by Email or Car Plate"
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
            keyExtractor={(row) => row.qrId.toString()}
            isLoading={isSearching}
            emptyIcon={QrCode}
            emptyTitle="No Records Found"
            skeletonRowCount={10}
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

        {user?.role === "CP_Admin" || user?.department === "MIS_SUPERADMIN" ? (
          <button
            onClick={() => router.push("/portal/car-park/registration")}
            className="fixed bottom-8 right-8 bg-primary text-primary-foreground hover:bg-primary/9 dark:bg-white dark:hover:bg-gray-200  dark:text-primary px-6 py-3 rounded-full shadow-lg flex items-center gap-2 font-semibold transition-all hover:shadow-xl z-10"
          >
            <Plus size={20} />
            New Registration
          </button>
        ) : null}
    </div>
  )
}