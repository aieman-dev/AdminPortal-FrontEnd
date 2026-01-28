"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { FileText, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/portal/page-header"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls" // Import Pagination
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search" // Use AutoSearch for consistency
import { carParkService } from "@/services/car-park-services"
import { CarParkApplication } from "@/type/car-park"
import { formatDate } from "@/lib/formatter"

export default function ApplicationsPage() {
    const toast = useAppToast()
    const router = useRouter()

    const [searchTerm, setSearchTerm] = useState("")
    const [applications, setApplications] = useState<CarParkApplication[]>([])
    const [loading, setLoading] = useState(false)
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(0)
    const [totalRecords, setTotalRecords] = useState(0)
    const PAGE_SIZE = 10;

    const fetchApplications = useCallback(async (page: number, query: string) => {
        setLoading(true)
        // Reset to page 1 if query changed (managed by caller or effect)
        
        try {
            const response = await carParkService.getApplications(page, PAGE_SIZE, query.trim())
            setApplications(response.items)
            setTotalPages(response.totalPages)
            setTotalRecords(response.totalCount)
            setCurrentPage(response.pageNumber)
            
            if (page === 1 && response.items.length > 0) {
                 // Optional: toast.info("Data Loaded", `Found ${response.totalCount} applications.`);
            }
        } catch (error) {
            toast.error("Error", "Failed to load applications.")
        } finally {
            setLoading(false)
        }
    }, [toast]);

    // Initial Load & Search
    useAutoSearch((query) => {
        setSearchTerm(query);
        fetchApplications(1, query);
    });

    const handleSearchClick = () => {
        fetchApplications(1, searchTerm);
    };

    const handlePageChange = (newPage: number) => {
        fetchApplications(newPage, searchTerm);
    };

    const handleReview = (id: number) => {
        router.push(`/portal/car-park/application/${id}`);
    }

    const columns: TableColumn<CarParkApplication>[] = [
        { 
            header: "App ID", 
            accessor: "applicationId", 
            className: "pl-6 w-[80px]",
            cell: (val) => <span className="font-mono text-muted-foreground">#{val}</span>
        },
        { 
            header: "Name", 
            accessor: "name", 
            className: "font-medium min-w-[180px]" 
        },
        { 
            header: "Email", 
            accessor: "email",
            cell: (val) => val || <span className="text-muted-foreground italic">N/A</span>
        },
        { 
            header: "Season Package", 
            accessor: "seasonPackage",
            cell: (val) => <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">{val}</span>
        },
        { 
            header: "Date", 
            accessor: "createdDate",
            cell: (val) => <span className="text-xs text-muted-foreground">{formatDate(val as string)}</span>
        },
        {
            header: "Action",
            accessor: "id",
            className: "text-right pr-6",
            cell: (id) => (
                <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleReview(id as number)}
                >
                    Review <ArrowRight className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Application New SuperApp" 
                description="Review and process pending season pass applications." 
            />

            <Card>
                <CardContent>
                    <SearchField 
                        label="Search Applications"
                        placeholder="Search by name, email or package..."
                        value={searchTerm}
                        onChange={setSearchTerm}
                        onSearch={handleSearchClick}
                        isSearching={loading}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <DataTable 
                        columns={columns}
                        data={applications}
                        keyExtractor={(row) => row.id.toString()}
                        isLoading={loading}
                        emptyTitle="No Pending Applications"
                        emptyMessage="All caught up! There are no applications to review."
                    />

                    {totalPages > 1 && (
                        <div className="mt-4">
                             <PaginationControls 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                                pageSize={PAGE_SIZE}
                                onPageChange={handlePageChange}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}