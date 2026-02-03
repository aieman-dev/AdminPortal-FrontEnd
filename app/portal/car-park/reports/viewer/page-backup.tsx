"use client"

import { useState, useEffect, useCallback } from "react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useAppToast } from "@/hooks/use-app-toast"
import { carParkService } from "@/services/car-park-services"
import { ReportPayload, ReportMetadata, ReportParameter } from "@/type/car-park"
import { format } from "date-fns"
import { 
    Breadcrumb, BreadcrumbItem, BreadcrumbLink, 
    BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator 
} from "@/components/ui/breadcrumb"
import { usePagination } from "@/hooks/use-pagination"

export default function ReportViewerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useAppToast();
    
    const reportCode = searchParams.get('report') || "";
    
    // --- DYNAMIC STATE ---
    const [meta, setMeta] = useState<ReportMetadata | null>(null);
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
    const [isMetaLoading, setIsMetaLoading] = useState(true);

    // Existing Data Table State
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<TableColumn<any>[]>([]);
    const [loading, setLoading] = useState(false);
    const pagination = usePagination({ pageSize: 50 });

    // --- 1. FETCH METADATA ON LOAD ---
    useEffect(() => {
        if (!reportCode) return;

        const loadMetadata = async () => {
            setIsMetaLoading(true);
            try {
                const metadata = await carParkService.getReportMetadata(reportCode);
                setMeta(metadata);
                setDynamicFilters({}); 
            } catch (error) {
                console.error("Meta Load Error:", error);
                toast.error("Config Error", "Failed to load report definition.");
            } finally {
                setIsMetaLoading(false);
            }
        };

        loadMetadata();
    }, [reportCode]);


    // --- 2. DYNAMIC PAYLOAD BUILDER ---
    const buildPayload = (page: number, size: number): ReportPayload => {
        return {
            reportName: reportCode,
            pageNumber: page,
            pageSize: size,
            parameters: dynamicFilters 
        };
    };

    // --- 3. DYNAMIC INPUT COMPONENT ---
    const renderFilterInput = (param: ReportParameter) => {
        const value = dynamicFilters[param.name];

        // TYPE: DATE
        if (param.type === 'date') {
            return (
                <div key={param.name} className="space-y-1.5 w-full">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        {param.label} {param.required && <span className="text-red-500">*</span>}
                    </Label>
                    <DatePicker 
                        date={value ? new Date(value) : undefined}
                        setDate={(d) => {
                            const val = d ? format(d, "yyyy-MM-dd") : null;
                            setDynamicFilters(prev => ({ ...prev, [param.name]: val }));
                        }}
                        className="h-10 bg-background border-input w-full"
                    />
                </div>
            );
        }

        // TYPE: SELECT (DROPDOWN)
        if (param.type === 'select' && param.options) {
            return (
                <div key={param.name} className="space-y-1.5 w-full min-w-[180px]">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                        {param.label} {param.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select 
                        value={value !== undefined && value !== null ? String(value) : "ALL"} 
                        onValueChange={(val) => {
                             // Handle "All" / null case
                             const finalVal = val === "ALL" ? null : val;
                             setDynamicFilters(prev => ({ ...prev, [param.name]: finalVal }));
                        }}
                    >
                        <SelectTrigger className="h-10 bg-background border-input">
                            <SelectValue placeholder={`Select ${param.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                            {param.options.map((opt, idx) => (
                                <SelectItem key={idx} value={opt.value !== null ? String(opt.value) : "ALL"}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        // TYPE: TEXT / NUMBER (Default)
        return (
            <div key={param.name} className="space-y-1.5 w-full">
                <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    {param.label} {param.required && <span className="text-red-500">*</span>}
                </Label>
                <Input 
                    type={param.type === 'number' ? 'number' : 'text'}
                    placeholder={param.placeholder || "Enter value..."}
                    value={value || ""}
                    onChange={(e) => {
                        const val = param.type === 'number' ? Number(e.target.value) : e.target.value;
                        setDynamicFilters(prev => ({ ...prev, [param.name]: val }));
                    }}
                    className="h-10 bg-background border-input"
                />
            </div>
        );
    };

    // --- EXECUTE REPORT ---
    const runReport = async (page: number = 1) => {
        setLoading(true);
        if (page !== pagination.currentPage) pagination.setCurrentPage(page);

        const payload = buildPayload(page, pagination.pageSize);

        try {
            const response = await carParkService.generateReport(payload);
            setData(response.items);
            pagination.setMetaData(response.totalPages, response.totalCount);

            if (response.items.length > 0) {
                const dynamicCols = generateColumns(response.items[0]);
                setColumns(dynamicCols);
            } else if (page === 1) {
                setColumns([]);
                toast.info("No Data", "No records found matching these filters.");
            }
        } catch (error) {
            toast.error("Execution Failed", "Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    // Helper for columns (Reused from your existing code)
    const generateColumns = (firstRow: any): TableColumn<any>[] => {
        if (!firstRow) return [];
        return Object.keys(firstRow).map((key, index) => ({
            header: key.replace(/([A-Z])/g, ' $1').trim(),
            accessor: key,
            className: index === 0 ? "pl-6 font-medium" : "",
            cell: (val: any) => {
                 // Simple date detection
                 if (typeof val === 'string' && val.includes('T') && val.length > 10 && !isNaN(Date.parse(val))) {
                     return new Date(val).toLocaleString();
                 }
                 return val;
            }
        }));
    };

    // --- RENDER ---
    if (isMetaLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p>Loading report configuration...</p>
            </div>
        );
    }

    if (!meta) {
        return <div className="p-8 text-center text-red-500">Report definition not found.</div>;
    }

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
            
            {/* Header */}
            <div className="space-y-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem><BreadcrumbLink href="/portal/car-park/reports">Reports Center</BreadcrumbLink></BreadcrumbItem>
                        <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5" /></BreadcrumbSeparator>
                        <BreadcrumbItem><BreadcrumbPage>{meta.friendlyName}</BreadcrumbPage></BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <div>
                     <h1 className="text-2xl font-bold tracking-tight">{meta.friendlyName}</h1>
                     <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
                </div>
            </div>

            {/* DYNAMIC FILTER CARD */}
            <Card className="bg-muted/20 border-dashed">
                <CardContent className="py-4">
                    <div className="flex flex-col xl:flex-row gap-6 items-end">
                        
                        {/* INPUTS GRID */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 w-full">
                            {meta.parameters.map(param => renderFilterInput(param))}
                        </div>

                        {/* ACTIONS */}
                        <div className="flex gap-2 shrink-0">
                             <Button onClick={() => setDynamicFilters({})} variant="ghost" size="sm" className="h-10">
                                <FilterX className="h-4 w-4 mr-2" /> Clear
                            </Button>
                             <Button onClick={() => runReport(1)} disabled={loading} className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2 fill-current" />} 
                                Run Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* DATA TABLE */}
            <Card className="flex-1 flex flex-col min-h-[500px]">
                <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex-1 overflow-auto">
                        <DataTable 
                            columns={columns}
                            data={data}
                            keyExtractor={(row, index) => index.toString()}
                            isLoading={loading}
                            emptyTitle="No Data Generated"
                            emptyMessage='Click "Run Report" to view data.'
                            emptyIcon={FileText}
                        />
                    </div>
                    {pagination.totalPages > 0 && (
                        <div className="p-4 border-t bg-muted/5 flex-shrink-0">
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