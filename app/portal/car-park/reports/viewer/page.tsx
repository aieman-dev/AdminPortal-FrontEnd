"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { 
    Play, Printer, FileSpreadsheet, 
    Loader2, FileText, ChevronRight, 
    FilterX, RotateCcw
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
import { cn } from "@/lib/utils"

export default function ReportViewerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const toast = useAppToast();
    
    const reportCode = searchParams.get('report') || "";
    
    // --- STATE ---
    const [meta, setMeta] = useState<ReportMetadata | null>(null);
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
    const [isMetaLoading, setIsMetaLoading] = useState(true);

    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<TableColumn<any>[]>([]);
    const [loading, setLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    
    const pagination = usePagination({ pageSize: 50 });

    // Add this helper at the top or inside the component
const validateFilters = () => {
    if (!meta) return false;
    
    const missing = meta.parameters
        .filter(p => p.required && !dynamicFilters[p.name]) // Check if required & empty
        .map(p => p.label);

    if (missing.length > 0) {
        toast.error("Missing Requirements", `Please fill in: ${missing.join(", ")}`);
        return false;
    }
    
    // Optional: Date Range Logic Check
    const start = dynamicFilters["StartDate"];
    const end = dynamicFilters["EndDate"];
    if (start && end && new Date(start) > new Date(end)) {
        toast.error("Invalid Date Range", "Start Date cannot be after End Date.");
        return false;
    }

    return true;
};

    // --- 1. FETCH METADATA (LOOP FIX APPLIED) ---
    useEffect(() => {
        if (!reportCode) return;

        let isMounted = true;
        const loadMetadata = async () => {
            setIsMetaLoading(true);
            try {
                const metadata = await carParkService.getReportMetadata(reportCode);
                if (isMounted) {
                    setMeta(metadata);
                    setDynamicFilters({}); 
                }
            } catch (error) {
                console.error("Meta Load Error:", error);
                if (isMounted) toast.error("Config Error", "Failed to load report definition.");
            } finally {
                if (isMounted) setIsMetaLoading(false);
            }
        };

        loadMetadata();
        return () => { isMounted = false; };
    }, [reportCode]); // toast removed to prevent infinite loops

    // --- 2. THEME-CONSISTENT COLUMN GENERATOR ---
    const generateColumns = useCallback((firstRow: any): TableColumn<any>[] => {
        if (!firstRow) return [];
        return Object.keys(firstRow).map((key, index) => ({
            header: key.replace(/([A-Z])/g, ' $1').trim(),
            accessor: key,
            // Styling consistent with Season Parking list
            className: cn(
                index === 0 ? "pl-6 font-mono text-muted-foreground font-medium" : "text-sm",
                key.toLowerCase().includes("package") && "text-indigo-700 dark:text-indigo-300 font-medium"
            ),
            cell: (val: any) => {
                 if (typeof val === 'string' && val.includes('T') && val.length > 10 && !isNaN(Date.parse(val))) {
                     return <span className="whitespace-nowrap">{new Date(val).toLocaleString()}</span>;
                 }
                 return val;
            }
        }));
    }, []);

    // --- 3. ACTIONS ---
    const runReport = async (page: number = 1) => {
        if (!validateFilters()) return;

        setLoading(true);
        if (page !== pagination.currentPage) pagination.setCurrentPage(page);

        try {
            const response = await carParkService.generateReport({
                reportName: reportCode,
                pageNumber: page,
                pageSize: pagination.pageSize,
                parameters: dynamicFilters 
            });
            setData(response.items);
            pagination.setMetaData(response.totalPages, response.totalCount);

            if (response.items.length > 0) {
                setColumns(generateColumns(response.items[0]));
                if (page === 1) toast.success("Success", `Found ${response.totalCount} records.`);
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

    // --- 4. DYNAMIC INPUT RENDERER (Individually Styled) ---
    const renderFilterInput = (param: ReportParameter) => {
        const value = dynamicFilters[param.name];
        const labelClass = "text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-1.5 block";
        const inputClass = "h-11 bg-background border-input shadow-sm focus:border-indigo-500 focus:ring-indigo-500/20 transition-all";

        const LabelWithRequired = () => (
        <Label className={labelClass}>
            {param.label} 
            {param.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
        );

        if (param.type === 'date') {
            return (
                <div key={param.name} className="space-y-1 w-full">
                    <LabelWithRequired />
                    <DatePicker 
                        date={value ? new Date(value) : undefined}
                        setDate={(d) => setDynamicFilters(prev => ({ ...prev, [param.name]: d ? format(d, "yyyy-MM-dd") : null }))}
                        className={inputClass}
                    />
                </div>
            );
        }

        if (param.type === 'select' && param.options) {
            return (
                <div key={param.name} className="space-y-1 w-full">
                    <Label className={labelClass}>{param.label}</Label>
                    <Select 
                        value={value !== undefined && value !== null ? String(value) : "ALL"} 
                        onValueChange={(val) => setDynamicFilters(prev => ({ ...prev, [param.name]: val === "ALL" ? null : val }))}
                    >
                        <SelectTrigger className={inputClass}><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                            {param.options.map((opt, idx) => (
                                <SelectItem key={`${param.name}-opt-${idx}`} value={opt.value !== null ? String(opt.value) : "ALL"}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            );
        }

        return (
            <div key={param.name} className="space-y-1 w-full">
                <Label className={labelClass}>{param.label}</Label>
                <Input 
                    type={param.type === 'number' ? 'number' : 'text'}
                    placeholder={param.placeholder || "Enter value..."}
                    value={value || ""}
                    onChange={(e) => setDynamicFilters(prev => ({ ...prev, [param.name]: param.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className={inputClass}
                />
            </div>
        );
    };

    if (isMetaLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                <p className="font-medium animate-pulse">Loading report configuration...</p>
            </div>
        );
    }

    if (!meta) return <div className="p-8 text-center text-red-500">Report definition not found.</div>;

    return (
        <div className="flex flex-col min-h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 print:p-0">
            
            {/* 1. HEADER SECTION (Theme Consistent) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="space-y-4">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem><BreadcrumbLink href="/portal/car-park/reports">Reports Center</BreadcrumbLink></BreadcrumbItem>
                            <BreadcrumbSeparator><ChevronRight className="h-3.5 w-3.5" /></BreadcrumbSeparator>
                            <BreadcrumbItem><BreadcrumbPage>{meta.friendlyName}</BreadcrumbPage></BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">{meta.friendlyName}</h1>
                        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{meta.description}</p>
                    </div>
                </div>

                <div className="flex gap-3 shrink-0">
                    <Button onClick={() => {}} disabled={data.length === 0 || isExporting} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10 h-11 px-6">
                        {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                        Export CSV
                    </Button>
                    <Button variant="outline" onClick={() => window.print()} disabled={data.length === 0} className="h-11 border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-6">
                        <Printer className="h-4 w-4 mr-2" /> Print / PDF
                    </Button>
                </div>
            </div>

            {/* 2. FILTER CARD (Dashed Border Style) */}
            <Card className="bg-muted/20 border-dashed border-2 shadow-none print:hidden">
                <CardContent className="py-6 px-6">
                    <div className="flex flex-col xl:flex-row gap-6 items-end">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1 w-full">
                            {meta.parameters.map(param => renderFilterInput(param))}
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <Button onClick={() => setDynamicFilters({})} variant="ghost" className="h-11 text-muted-foreground hover:text-foreground">
                                <RotateCcw className="h-4 w-4 mr-2" /> Reset
                            </Button>
                            <Button onClick={() => runReport(1)} disabled={loading} className="h-11 px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 font-semibold transition-all hover:scale-[1.02]">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2 fill-current" />} 
                                Run Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. TABLE SECTION */}
            <Card className="flex-1 flex flex-col min-h-[500px] overflow-hidden shadow-sm border-gray-200 dark:border-zinc-800 print:border-none print:shadow-none">
                <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <DataTable 
                            columns={columns}
                            data={data}
                            keyExtractor={(_, index) => `row-${index}`}
                            isLoading={loading}
                            emptyTitle="No Data Generated"
                            emptyMessage='Configure filters and click "Run Report" to generate results.'
                            emptyIcon={FileText}
                        />
                    </div>
                    {pagination.totalPages > 0 && (
                        <div className="p-6 border-t bg-muted/5 flex-shrink-0 print:hidden">
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