"use client"

import { useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ArrowLeft, Play, Printer, FileSpreadsheet, Loader2, FileText, ChevronRight, Search, FilterX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageHeader } from "@/components/portal/page-header" 
import { DatePicker } from "@/components/ui/date-picker"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useAppToast } from "@/hooks/use-app-toast"
import { carParkService } from "@/services/car-park-services"
import { ReportPayload } from "@/type/car-park"
import { startOfMonth, endOfMonth, format } from "date-fns"
import { 
    Breadcrumb, 
    BreadcrumbItem, 
    BreadcrumbLink, 
    BreadcrumbList, 
    BreadcrumbPage, 
    BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"

export default function ReportViewerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useAppToast();
    
    // 1. URL Params
    const reportCode = searchParams.get('report') || "";
    const reportName = reportCode.replace(/^report_/i, "").replace(/_/g, " ");

    // 2. Filter State
    const [dateRange, setDateRange] = useState<{ start: Date | undefined, end: Date | undefined }>({
        start: undefined, 
        end: undefined
    });
    const [accId, setAccId] = useState("");
    
    // 3. Data State
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<TableColumn<any>[]>([]);
    const [loading, setLoading] = useState(false);
    
    // 4. Export State
    const [isExporting, setIsExporting] = useState(false);
    
    // 5. Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const PAGE_SIZE = 50;

    // --- HELPER: Build Payload Dynamically ---
    const buildPayload = (page: number, size: number): ReportPayload => {
        // 1. Base Payload
        const payload: ReportPayload = {
            reportName: reportCode,
            pageNumber: page,
            pageSize: size
        };

        // 2. Construct Parameters Object
        const params: Record<string, any> = {};
        
        if (dateRange.start) params.StartDate = format(dateRange.start, "yyyy-MM-dd");
        if (dateRange.end) params.EndDate = format(dateRange.end, "yyyy-MM-dd");
        if (accId.trim()) params.AccID = accId.trim();

        // 3. Only attach 'parameters' if there are actual keys
        if (Object.keys(params).length > 0) {
            payload.parameters = params;
        }

        return payload;
    };

    // --- HELPER: Generate Columns Dynamically ---
    const generateColumns = (firstRow: any): TableColumn<any>[] => {
        if (!firstRow) return [];
        
        return Object.keys(firstRow).map((key, index) => {
            const header = key.replace(/([A-Z])/g, ' $1').trim();
            
            return {
                header: header,
                accessor: key,
                className: index === 0 ? "pl-6 font-medium" : "", 
                cell: (val: any) => {
                    if (typeof val === 'string' && val.includes('T') && !isNaN(Date.parse(val)) && val.length > 10) {
                        return <span className="whitespace-nowrap">{new Date(val).toLocaleString()}</span>;
                    }
                    return val;
                }
            };
        });
    };

    // --- FETCH FULL DATA FOR EXPORT ---
    const fetchFullData = async () => {
        const limit = totalRecords > 0 ? totalRecords : 10000;
        const startStr = dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : null;
        const endStr = dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : null;

        // Fetch everything by setting pageSize to totalRecords
        const payload: ReportPayload = {
            reportName: reportCode,
            pageNumber: 1,
            pageSize: limit,
            parameters: {
                AccID: accId ? accId.trim() : null,
                StartDate: startStr,
                EndDate: endStr
            }
        };

        const response = await carParkService.generateReport(payload);
        return response.items || [];
    };

    // --- EXPORT TO EXCEL (CSV) ---
    const handleExportExcel = async () => {
        if (totalRecords === 0) {
            toast.info("No Data", "Generate a report first before exporting.");
            return;
        }

        setIsExporting(true);
        try {
            // 1. Fetch ALL data
            const fullData = await fetchFullData();
            
            if (fullData.length === 0) {
                 toast.error("Export Error", "Could not retrieve full dataset.");
                 return;
            }

            // 2. Generate CSV
            // Re-generate columns from full data just in case structure varies slightly
            const exportCols = columns.length > 0 ? columns : generateColumns(fullData[0]);
            
            const headers = exportCols.map(c => c.header).join(",");
            
            const rows = fullData.map(row => 
                exportCols.map(c => {
                    const val = row[c.accessor as string];
                    const cleanVal = val ? String(val).replace(/"/g, '""') : "";
                    return `"${cleanVal}"`;
                }).join(",")
            );

            const csvContent = [headers, ...rows].join("\n");
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `${reportName}_Full_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success("Export Complete", `Downloaded ${fullData.length} records.`);

        } catch (error) {
            console.error(error);
            toast.error("Export Failed", "An error occurred while downloading.");
        } finally {
            setIsExporting(false);
        }
    };

    // --- EXPORT TO PDF (Browser Print) ---
    // Note: Browser print prints "Current View". Printing 1000 rows via DOM is heavy. 
    // We advise users to use Excel for large data, or print for summary.
    const handlePrint = () => {
        if (data.length === 0) {
             toast.info("No Data", "Generate a report first before printing.");
             return;
        }
        window.print();
    };

    // --- FETCH REPORT (View) ---
    const runReport = async (page: number = 1) => {
        if (!reportCode) return;
        
        setLoading(true);
        setCurrentPage(page);

        // Use the dynamic builder
        const payload = buildPayload(page, PAGE_SIZE);

        try {
            const response = await carParkService.generateReport(payload);
            
            setData(response.items);
            setTotalRecords(response.totalCount);
            setTotalPages(response.totalPages);

            if (response.items.length > 0) {
                const dynamicCols = generateColumns(response.items[0]);
                setColumns(dynamicCols);
            } else {
                if (page === 1) setColumns([]);
            }
            
            if (page === 1) {
                if (response.items.length > 0) {
                    toast.success("Report Generated", `Found ${response.totalCount} records.`);
                } else {
                    toast.info("No Data", "No records found. Try adjusting filters.");
                }
            }
        } catch (error) {
            console.error("Report Error:", error);
            toast.error("Execution Failed", "Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setDateRange({ start: undefined, end: undefined });
        setAccId("");
    }

    if (!reportCode) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-lg font-bold text-muted-foreground">No Report Selected</h3>
                <Button onClick={() => router.back()} variant="outline">Return to Reports</Button>
            </div>
        )
    }
    

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto p-6 space-y-6 print:p-0 print:min-h-0">
            
            {/* 1. Header & Breadcrumbs (Hidden on Print) */}
            <div className="space-y-4 print:hidden">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/portal/car-park/reports" className="flex items-center gap-1">
                                Reports Center
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-semibold text-foreground">{reportName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                {/* Title & Actions */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                         <h1 className="text-2xl font-bold tracking-tight">{reportName}</h1>
                         <p className="text-sm text-muted-foreground font-mono mt-1">{reportCode}</p>
                    </div>
                    
                    <div className="flex gap-3">
                         {/* Modern Excel Button */}
                        <Button 
                            onClick={handleExportExcel} 
                            disabled={data.length === 0 || isExporting} 
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all active:scale-95"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                            {isExporting ? "Downloading..." : "Export Full Excel"}
                        </Button>
                        
                        {/* Modern Print Button */}
                        <Button 
                            variant="outline" 
                            onClick={handlePrint} 
                            disabled={data.length === 0}
                            className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                        >
                            <Printer className="h-4 w-4 mr-2" /> Print View / PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* 2. Filter Bar (Hidden on Print) */}
            <Card className="flex-shrink-0 print:hidden bg-muted/20 border-dashed">
                <CardContent className="py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        
                        {/* Date Range Filters */}
                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</Label>
                                <DatePicker 
                                    date={dateRange.start} 
                                    setDate={(d) => setDateRange(prev => ({...prev, start: d}))} 
                                    className="h-10 w-[140px] bg-background border-input"
                                    placeholder="No filter" 
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">End Date</Label>
                                <DatePicker 
                                    date={dateRange.end} 
                                    setDate={(d) => setDateRange(prev => ({...prev, end: d}))} 
                                    className="h-10 w-[140px] bg-background border-input"
                                    placeholder="No filter" 
                                />
                            </div>
                        </div>

                        {/* Account ID / Search Param */}
                        <div className="space-y-1.5 flex-1 min-w-[200px]">
                            <Label className="text-xs font-semibold uppercase text-muted-foreground">Account ID / Search</Label>
                            <div className="relative">
                                <Input 
                                    placeholder="Optional (Enter ID/Keyword)" 
                                    value={accId} 
                                    onChange={(e) => setAccId(e.target.value)} 
                                    className="h-10 pl-9 bg-background border-input"
                                />
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <Button 
                                onClick={clearFilters}
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 text-muted-foreground hover:text-destructive"
                                title="Clear Filters"
                            >
                                <FilterX className="h-4 w-4" />
                            </Button>

                             <Button onClick={() => runReport(1)} disabled={loading} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2 fill-current" />} 
                                Run Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Data Table */}
            <Card className="flex-1 flex flex-col min-h-[600px] overflow-hidden print:border-none print:shadow-none print:min-h-0 print:overflow-visible">
                <CardContent className="flex-1 p-0 flex flex-col min-h-0 print:p-0 print:block">
                    
                    {/* Print Only Header */}
                    <div className="hidden print:block mb-6 p-4 border-b">
                        <h1 className="text-3xl font-bold text-black">{reportName}</h1>
                        <p className="text-sm text-gray-600 mt-1">Generated: {new Date().toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Total Records: {totalRecords}</p>
                    </div>

                    <div className="flex-1 overflow-auto print:overflow-visible">
                         <DataTable 
                            columns={columns}
                            data={data}
                            keyExtractor={(row, index) => index.toString()}
                            isLoading={loading}
                            emptyTitle="No Data Generated"
                            emptyMessage='Adjust filters and click "Run Report" to view data.'
                            emptyIcon={FileText}
                        />
                    </div>
                    
                    {/* Pagination - Hidden on Print */}
                    {totalPages > 0 && (
                        <div className="p-4 border-t bg-muted/5 flex-shrink-0 print:hidden">
                            <PaginationControls 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={totalRecords}
                                pageSize={PAGE_SIZE}
                                onPageChange={(page) => runReport(page)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}