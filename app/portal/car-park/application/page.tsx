"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/portal/page-header"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls" 
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search" 
import { usePagination } from "@/hooks/use-pagination"
import { carParkService } from "@/services/car-park-services"
import { CarParkApplication } from "@/type/car-park"
import { formatDate } from "@/lib/formatter"

export default function ApplicationsPage() {
    const toast = useAppToast()
    const router = useRouter()

    const [searchTerm, setSearchTerm] = useState("")
    const [applications, setApplications] = useState<CarParkApplication[]>([])
    const [loading, setLoading] = useState(false)
    
    const pagination = usePagination({ pageSize: 10 });

    const fetchApplications = useCallback(async (page: number, query: string) => {
        setLoading(true)
        try {
            const response = await carParkService.getApplications(page, pagination.pageSize, query.trim())
            setApplications(response.items)
            pagination.setMetaData(response.totalPages, response.totalCount)
            
            if (page === 1 && response.items.length > 0) {
            }
        } catch (error) {
            toast.error("Error", "Failed to load applications.")
        } finally {
            setLoading(false)
        }
    }, [pagination.pageSize, toast]);

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

                    {pagination.totalPages > 1 && (
                        <div className="mt-4">
                             <PaginationControls 
                                currentPage={pagination.currentPage}
                                totalPages={pagination.totalPages}
                                totalRecords={pagination.totalRecords}
                                pageSize={pagination.pageSize}
                                onPageChange={(page) => fetchApplications(page, searchTerm)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}