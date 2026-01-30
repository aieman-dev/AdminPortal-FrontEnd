// app/portal/car-park/reports/viewer/page.tsx

"use client"

import { useState, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
    ArrowLeft, Play, Printer, FileSpreadsheet, 
    Loader2, FileText, ChevronRight, Search, 
    FilterX, Filter 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/ui/date-picker"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useAppToast } from "@/hooks/use-app-toast"
import { carParkService } from "@/services/car-park-services"
import { ReportPayload } from "@/type/car-park"
import { format } from "date-fns"
import { 
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, 
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, 
  SheetTitle, SheetTrigger, SheetFooter
} from "@/components/ui/sheet"
import { usePagination } from "@/hooks/use-pagination" // 1. Import Hook

export default function ReportViewerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useAppToast();
    
    const reportCode = searchParams.get('report') || "";
    const reportName = reportCode.replace(/^report_/i, "").replace(/_/g, " ");

    const [dateRange, setDateRange] = useState<{ start: Date | undefined, end: Date | undefined }>({
        start: undefined, 
        end: undefined
    });
    const [accId, setAccId] = useState("");
    
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<TableColumn<any>[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    // Mobile Sheet State
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    
    // 2. Use the Hook instead of manual state
    const pagination = usePagination({ pageSize: 50 });

    const buildPayload = (page: number, size: number): ReportPayload => {
        const payload: ReportPayload = {
            reportName: reportCode,
            pageNumber: page,
            pageSize: size
        };
        const params: Record<string, any> = {};
        if (dateRange.start) params.StartDate = format(dateRange.start, "yyyy-MM-dd");
        if (dateRange.end) params.EndDate = format(dateRange.end, "yyyy-MM-dd");
        if (accId.trim()) params.AccID = accId.trim();

        if (Object.keys(params).length > 0) {
            payload.parameters = params;
        }
        return payload;
    };

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

    const fetchFullData = async () => {
        const limit = pagination.totalRecords > 0 ? pagination.totalRecords : 10000;
        const startStr = dateRange.start ? format(dateRange.start, "yyyy-MM-dd") : null;
        const endStr = dateRange.end ? format(dateRange.end, "yyyy-MM-dd") : null;

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

    const handleExportExcel = async () => {
        if (pagination.totalRecords === 0) {
            toast.info("No Data", "Generate a report first before exporting.");
            return;
        }
        setIsExporting(true);
        try {
            const fullData = await fetchFullData();
            if (fullData.length === 0) {
                 toast.error("Export Error", "Could not retrieve full dataset.");
                 return;
            }
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

    const handlePrint = () => {
        if (data.length === 0) {
             toast.info("No Data", "Generate a report first before printing.");
             return;
        }
        window.print();
    };

    const runReport = async (page: number = 1) => {
        if (!reportCode) return;
        setLoading(true);
        
        // 3. Update hook state
        if (page !== pagination.currentPage) pagination.setCurrentPage(page);
        
        setIsFilterOpen(false); // Close mobile sheet on run

        const payload = buildPayload(page, pagination.pageSize);

        try {
            const response = await carParkService.generateReport(payload);
            setData(response.items);
            
            // 4. Update metadata via hook
            pagination.setMetaData(response.totalPages, response.totalCount);

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

    // --- REUSABLE FILTER COMPONENT ---
    const FilterFields = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className={`flex ${isMobile ? 'flex-col gap-4' : 'flex-row gap-4 w-full'}`}>

            {/* Dates Group */}
            <div className={`grid grid-cols-2 gap-3 ${isMobile ? 'w-full' : 'w-auto'}`}>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">Start Date</Label>
                    <DatePicker 
                        date={dateRange.start} 
                        setDate={(d) => setDateRange(prev => ({...prev, start: d}))} 
                        className={`h-10 bg-background border-input ${isMobile ? 'w-full' : 'w-[140px]'}`}
                        placeholder="No filter" 
                    />
                </div>
                <div className="space-y-1.5">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">End Date</Label>
                    <DatePicker 
                        date={dateRange.end} 
                        setDate={(d) => setDateRange(prev => ({...prev, end: d}))} 
                        className={`h-10 bg-background border-input ${isMobile ? 'w-full' : 'w-[140px]'}`}
                        placeholder="No filter" 
                    />
                </div>
            </div>

            <div className={`space-y-1.5 ${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'}`}>
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
        </div>
    );

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-4 md:space-y-6 print:p-0 print:min-h-0">
            
            {/* Header */}
            <div className="space-y-4 print:hidden">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/portal/car-park/reports" className="flex items-center gap-1">
                                Reports Center
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5" /></BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-semibold text-foreground">{reportName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                         <h1 className="text-2xl font-bold tracking-tight">{reportName}</h1>
                         <p className="text-sm text-muted-foreground font-mono mt-1">{reportCode}</p>
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                            onClick={handleExportExcel} 
                            disabled={data.length === 0 || isExporting} 
                            className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                            {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                            Export
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={handlePrint} 
                            disabled={data.length === 0}
                            className="flex-1 md:flex-none border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400"
                        >
                            <Printer className="h-4 w-4 mr-2" /> Print / Save PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* --- DESKTOP FILTERS (Single Row Layout) --- */}
            <Card className="hidden md:block flex-shrink-0 print:hidden bg-muted/20 border-dashed">
                <CardContent className="py-4">
                    <div className="flex flex-row gap-4 items-end justify-between">
                        {/* Filter Fields Container - Takes available space */}
                        <div className="flex-1">
                            <FilterFields isMobile={false} />
                        </div>

                        {/* Action Buttons - Fixed width / Aligned Right */}
                        <div className="flex gap-2 ml-4 shrink-0">
                             <Button onClick={clearFilters} variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground" title="Clear Filters">
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

            {/* --- MOBILE FILTER BAR (Visible on Mobile) --- */}
            <div className="md:hidden flex gap-2">
                <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" className="flex-1 h-11 border-indigo-200 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300">
                            <Filter className="h-4 w-4 mr-2" /> Filter Report
                        </Button>
                    </SheetTrigger>

                    <SheetContent side="bottom" className="rounded-t-xl h-auto max-h-[85vh] px-0">
                        <SheetHeader className="text-left mb-4 px-6 pt-4">
                            <SheetTitle>Report Filters</SheetTitle>
                            <SheetDescription>Set parameters to generate the report.</SheetDescription>
                        </SheetHeader>
                        
                        <div className="px-6 py-2 overflow-y-auto">
                            <FilterFields isMobile={true} />
                        </div>

                        <SheetFooter className="mt-4 flex-row gap-3 px-6 pb-6 pt-2 border-t">
                            <Button variant="outline" className="flex-1 h-11" onClick={clearFilters}>Reset</Button>
                            <Button className="flex-1 h-11 bg-indigo-600 text-white" onClick={() => runReport(1)}>Run Report</Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Data Table */}
            <Card className="flex-1 flex flex-col min-h-[600px] overflow-hidden print:border-none print:shadow-none print:min-h-0 print:overflow-visible">
                <CardContent className="flex-1 p-0 flex flex-col min-h-0 print:p-0 print:block">
                    <div className="hidden print:block mb-6 p-4 border-b">
                        <h1 className="text-3xl font-bold text-black">{reportName}</h1>
                        <p className="text-sm text-gray-600 mt-1">Generated: {new Date().toLocaleString()}</p>
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
                    
                    {pagination.totalPages > 0 && (
                        <div className="p-4 border-t bg-muted/5 flex-shrink-0 print:hidden">
                            {/* 5. Use spread props + explicit handler to trigger fetch */}
                            <PaginationControls 
                                {...pagination.paginationProps}
                                onPageChange={(page) => runReport(page)}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}