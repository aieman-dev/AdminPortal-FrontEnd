"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, RefreshCw } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SearchField } from "@/components/shared-components/search-field"
import { PageHeader } from "@/components/portal/page-header"
import { carParkService } from "@/services/car-park-services"
import { ReportDefinition } from "@/type/car-park"
import { useAppToast } from "@/hooks/use-app-toast"

export default function ReportsPage() {
    const router = useRouter()
    const toast = useAppToast()
    
    const [searchTerm, setSearchTerm] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [allReports, setAllReports] = useState<ReportDefinition[]>([])
    const [filteredReports, setFilteredReports] = useState<ReportDefinition[]>([])

    // Fetch from API
    const loadReports = async () => {
        setIsLoading(true)
        try {
            const data = await carParkService.getReports()
            setAllReports(data)
            setFilteredReports(data)
        } catch (error) {
            console.error("Reports Error:", error);
            toast.error("Error", "Failed to load report list.")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadReports()
    }, [])

    // Client-side filtering
    const handleSearch = (term: string) => {
        setSearchTerm(term)
        if (!term.trim()) {
            setFilteredReports(allReports)
            return
        }
        
        const lowerTerm = term.toLowerCase()
        const results = allReports.filter(r => 
            r.name.toLowerCase().includes(lowerTerm) || 
            r.code.toLowerCase().includes(lowerTerm)
        )
        setFilteredReports(results)
    }

    const handleViewReport = (report: ReportDefinition) => {
        // Pass the code via URL. The viewer will fetch/derive details.
        router.push(`/portal/car-park/reports/viewer?report=${encodeURIComponent(report.code)}`);
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
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <SearchField 
                                label="Search Reports"
                                placeholder="Search by report name or code"
                                value={searchTerm}
                                onChange={handleSearch}
                                onSearch={() => handleSearch(searchTerm)}
                                isSearching={isLoading}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={loadReports} className="h-11 w-11 shrink-0" title="Refresh List">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="p-0">
                    <DataTable 
                        columns={columns}
                        data={filteredReports}
                        keyExtractor={(row) => row.code}
                        isLoading={isLoading}
                        emptyIcon={FileText}
                        emptyTitle="No Reports Found"
                        emptyMessage="Try adjusting your search terms."
                    />
                </CardContent>
            </Card>
        </div>
    )
}