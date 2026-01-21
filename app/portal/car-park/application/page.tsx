"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/portal/page-header"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { useAppToast } from "@/hooks/use-app-toast"
import { carParkService } from "@/services/car-park-services"
import { CarParkApplication } from "@/type/car-park"

export default function ApplicationsPage() {
    const toast = useAppToast()
    const router = useRouter()

    const [searchTerm, setSearchTerm] = useState("")
    const [applications, setApplications] = useState<CarParkApplication[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const data = await carParkService.getApplications(searchTerm)
                setApplications(data)
            } catch (error) {
                toast.error("Error", "Failed to load applications.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [searchTerm])

    const handleReview = (id: number) => {
        router.push(`/portal/car-park/application/${id}`);
    }

    const columns: TableColumn<CarParkApplication>[] = [
        { 
            header: "Name", 
            accessor: "name", 
            className: "pl-6 font-medium min-w-[180px]" 
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
            header: "Document", 
            accessor: "documentUrl",
            cell: (val) => val ? (
                <a 
                    href={val as string} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded w-fit"
                    onClick={(e) => e.stopPropagation()}
                >
                    <FileText className="h-3 w-3" /> View
                </a>
            ) : (
                <span className="text-xs text-muted-foreground">-</span>
            )
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
                        onSearch={() => {}} // Auto-search handles it
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
                </CardContent>
            </Card>
        </div>
    )
}