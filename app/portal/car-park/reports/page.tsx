"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { PageHeader } from "@/components/portal/page-header"
import { CAR_PARK_REPORTS, ReportDefinition } from "@/config/reports"

export default function ReportsPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [filteredReports, setFilteredReports] = useState<ReportDefinition[]>([])

    // Simulate initial data fetch loading
    useEffect(() => {
        const loadReports = async () => {
            setIsLoading(true)
            // Simulate network delay (e.g. 800ms)
            await new Promise(resolve => setTimeout(resolve, 800))
            setFilteredReports(CAR_PARK_REPORTS)
            setIsLoading(false)
        }
        loadReports()
    }, [])

    // Handle Search with loading simulation
    const handleSearch = (term: string) => {
        setIsLoading(true)
        setSearchTerm(term)
        
        // Simulate search delay
        setTimeout(() => {
            const results = CAR_PARK_REPORTS.filter(r => 
                r.name.toLowerCase().includes(term.toLowerCase()) || 
                r.code.toLowerCase().includes(term.toLowerCase()) ||
                r.description.toLowerCase().includes(term.toLowerCase())
            )
            setFilteredReports(results)
            setIsLoading(false)
        }, 500)
    }

    const handleViewReport = (report: ReportDefinition) => {
        router.push(`/portal/car-park/reports/viewer?report=${report.code}`);
    }

    const columns: TableColumn<ReportDefinition>[] = [
        { 
            header: "No", 
            accessor: "id", 
            className: "pl-6 w-[60px] text-muted-foreground font-mono text-xs",
            cell: (val) => val
        },
        { 
            header: "Report Name", 
            accessor: "name", 
            className: "w-[350px]", 
            cell: (val, row) => (
                <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-sm text-foreground">{val}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">{row.code}</span>
                </div>
            )
        },
        { 
            header: "Description", 
            accessor: "description",
            cell: (val) => (
                <div className="text-sm text-muted-foreground truncate max-w-[500px]" title={val as string}>
                    {val}
                </div>
            )
        },
        {
            header: "Action",
            accessor: "id",
            className: "text-right pr-6",
            cell: (_, row) => (
                <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleViewReport(row)}
                    className="h-8 gap-2 text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-zinc-800"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                </Button>
            )
        }
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Reports Center" 
                description="Access standard operational and audit reports." 
            />

            <Card>
                <CardContent>
                    <SearchField 
                        label="Search Reports"
                        placeholder="Search by report name or code..."
                        value={searchTerm}
                        onChange={(val) => handleSearch(val)} // Trigger search on type or use onSearch for enter key
                        onSearch={() => handleSearch(searchTerm)}
                        isSearching={isLoading}
                    />
                </CardContent>
            </Card>

            <Card>
                <CardContent>
                    <DataTable 
                        columns={columns}
                        data={filteredReports}
                        keyExtractor={(row) => row.code}
                        isLoading={isLoading} // Triggers the TableSkeleton
                        emptyIcon={FileText}
                        emptyTitle="No Reports Found"
                        emptyMessage="Try adjusting your search terms."
                    />
                </CardContent>
            </Card>
        </div>
    )
}