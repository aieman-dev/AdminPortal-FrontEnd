"use client"

import { useState, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Pencil, Car, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useAppToast } from "@/hooks/use-app-toast"
import { usePagination } from "@/hooks/use-pagination"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { hrService } from "@/services/hr-services"
import { CarParkPass } from "@/type/hr"
import { formatDateTime } from "@/lib/formatter"

export default function SeasonPassTab() {
    const router = useRouter()
    const toast = useAppToast()
    const pagination = usePagination({ pageSize: 20 })
    
    const [data, setData] = useState<CarParkPass[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [isSearching, setIsSearching] = useState(false)

    // Fetch Logic
    const fetchData = useCallback(async (page: number, query: string) => {
        setIsSearching(true)
        if (page !== pagination.currentPage) pagination.setCurrentPage(page)

        try {
            const res = await hrService.getQrListing(page, pagination.pageSize, query.trim())
            setData(res.items)
            pagination.setMetaData(res.totalPages, res.totalCount)
        } catch (error) {
            toast.error("Error", "Failed to fetch season pass data.")
        } finally {
            setIsSearching(false)
        }
    }, [pagination.pageSize, toast])

    // Auto Search
    useAutoSearch((query) => {
        setSearchTerm(query)
        fetchData(1, query)
    })

    const handleEdit = (item: CarParkPass) => {
        // Redirects to Car Park Module Detail for now (since HR detail pages don't exist yet)
        router.push(`/portal/hr/season-parking/${item.qrId}?accId=${item.accId}`)
    }

    const columns: TableColumn<CarParkPass>[] = useMemo(() => [
        { 
            header: "QrID", accessor: "qrId", className: "pl-6 w-[80px]", 
            cell: (val) => <span className="font-mono text-muted-foreground">{val}</span> 
        },
        { header: "Email", accessor: "email", className: "font-medium" },
        { 
            header: "Staff No", accessor: "staffNo",
            cell: (val) => val !== "-" ? <Badge variant="secondary" className="font-normal">{val}</Badge> : <span className="text-muted-foreground">-</span>
        },
        { 
            header: "Car Plate", accessor: "plateNo", 
            cell: (value, row) => (
                <HoverCard openDelay={100} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <span className="font-mono uppercase tracking-wide cursor-pointer hover:text-indigo-600 transition-colors border-b border-none border-muted-foreground/50">
                            {value}
                        </span>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80 p-0 overflow-hidden border shadow-xl">
                        <div className="bg-muted/50 px-4 py-3 border-b">
                            <h4 className="text-sm font-bold">{row.name}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">Unit: {row.unitNo || "-"}</p>
                        </div>
                        <div className="p-4 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Expiry</span>
                                <span className="font-medium">{formatDateTime(row.expiryDate)}</span>
                            </div>
                            <Button size="sm" className="w-full h-8 mt-2" onClick={() => handleEdit(row)}>
                                Manage Pass <ChevronRight className="ml-1 h-3 w-3" />
                            </Button>
                        </div>
                    </HoverCardContent>
                </HoverCard>
            )
        },
        { 
            header: "Season Package", accessor: "packageName", 
            cell: (val) => <span className="text-xs text-muted-foreground truncate max-w-[200px] block" title={val as string}>{val}</span> 
        },
        { 
            header: "Status", accessor: "status", 
            cell: (val) => <StatusBadge status={val as string} /> 
        },
        {
            header: "Action", accessor: "accId", className: "text-right pr-6",
            cell: (_, row) => (
                <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                    <Pencil className="h-3.5 w-3.5 mr-2 text-muted-foreground" /> Edit
                </Button>
            )
        }
    ], [])

    return (
        <div className="space-y-4">
            <Card>
                <CardContent>
                    <SearchField 
                        label="Search Season Passes"
                        placeholder="Search by Email or Car Plate"
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onSearch={() => fetchData(1, searchTerm)}
                        isSearching={isSearching}
                    />
                </CardContent>
            </Card>
            <Card>
                <CardContent className="p-0">
                    <DataTable 
                        columns={columns} 
                        data={data} 
                        keyExtractor={(r) => r.qrId.toString()}
                        isLoading={isSearching}
                        emptyIcon={Car}
                        emptyTitle="No Passes Found"
                        emptyMessage="No active season passes match your search."
                        pagination={{
                            currentPage: pagination.currentPage,
                            totalPages: pagination.totalPages,
                            totalRecords: pagination.totalRecords,
                            pageSize: pagination.pageSize,
                            onPageChange: (p) => fetchData(p, searchTerm)
                        }}
                    />
                </CardContent>
            </Card>
        </div>
    )
}