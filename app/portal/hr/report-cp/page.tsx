"use client"

import { useState, useCallback } from "react"
import { Play, Printer, FileSpreadsheet, Loader2, FileText, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { useAppToast } from "@/hooks/use-app-toast"
import { hrService } from "@/services/hr-services" 
import { PageHeader } from "@/components/portal/page-header"
import { usePagination } from "@/hooks/use-pagination"
import { cn } from "@/lib/utils"

// --- 1. STATIC CONFIGURATION ---
const STATIC_META = {
    friendlyName: "Staff Parking Listing",
    description: "View staff parking records by Account ID.",
    parameters: [
        {
            name: "AccID",
            label: "Account ID",
            type: "text",
            placeholder: "Enter Account ID (e.g. 1025)"
        }
    ]
};

export default function StaffParkingReportPage() {
    const toast = useAppToast();
    
    // State
    const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
    const [data, setData] = useState<any[]>([]);
    const [columns, setColumns] = useState<TableColumn<any>[]>([]);
    const [loading, setLoading] = useState(false);
    
    const pagination = usePagination({ pageSize: 20 });

    // --- 2. COLUMN GENERATOR ---
    const generateColumns = useCallback((firstRow: any): TableColumn<any>[] => {
        if (!firstRow) return [];
        return Object.keys(firstRow).map((key, index) => ({
            header: key.replace(/([A-Z])/g, ' $1').trim(),
            accessor: key,
            className: cn(
                index === 0 ? "pl-6 font-mono text-muted-foreground font-medium" : "text-sm",
                key.toLowerCase().includes("status") && "font-medium text-indigo-600"
            ),
            cell: (val: any) => {
                 if (typeof val === 'string' && val.includes('T') && val.length > 10 && !isNaN(Date.parse(val))) {
                     return <span className="whitespace-nowrap">{new Date(val).toLocaleDateString()}</span>;
                 }
                 return val;
            }
        }));
    }, []);

    // --- 3. RUN REPORT ---
    const runReport = async (page: number = 1) => {
        setLoading(true);
        if (page !== pagination.currentPage) pagination.setCurrentPage(page);

        try {
            const response = await hrService.generateReport({
                reportName: "", 
                pageNumber: page,
                pageSize: pagination.pageSize,
                parameters: dynamicFilters 
            });
            
            setData(response.items);
            pagination.setMetaData(response.totalPages, response.totalCount);

            if (response.items.length > 0) {
                setColumns(generateColumns(response.items[0]));
                if (page === 1) toast.success("Report Generated", `Found ${response.totalCount} records.`);
            } else if (page === 1) {
                setColumns([]);
                toast.info("No Data", "No records found.");
            }
        } catch (error) {
            toast.error("Execution Failed", "Failed to generate report.");
        } finally {
            setLoading(false);
        }
    };

    // --- 4. RENDER INPUTS (Styled like Car Park Report) ---
    const renderInput = (param: any) => {
        const value = dynamicFilters[param.name];
        // Matches the exact style from the Car Park Report
        const inputClass = "h-11 bg-background border-input shadow-sm focus:border-indigo-500 focus:ring-indigo-500/20 transition-all";
        const labelClass = "text-[11px] font-bold uppercase text-muted-foreground tracking-wider mb-1.5 block";

        if (param.type === 'select') {
            return (
                <div key={param.name} className="space-y-1 w-full">
                    <Label className={labelClass}>{param.label}</Label>
                    <Select 
                        value={value || "ALL"} 
                        onValueChange={(val) => setDynamicFilters(prev => ({ ...prev, [param.name]: val === "ALL" ? null : val }))}
                    >
                        <SelectTrigger className={inputClass}><SelectValue placeholder="All" /></SelectTrigger>
                        <SelectContent>
                            {param.options.map((opt: any, idx: number) => (
                                <SelectItem key={idx} value={opt.value || "ALL"}>{opt.label}</SelectItem>
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
                    placeholder={param.placeholder}
                    value={value || ""}
                    onChange={(e) => setDynamicFilters(prev => ({ ...prev, [param.name]: e.target.value }))}
                    className={inputClass}
                    onKeyDown={(e) => e.key === "Enter" && runReport(1)}
                />
            </div>
        );
    };

    return (
        <div className="flex flex-col space-y-8 p-4 md:p-8 animate-in fade-in duration-500">
            
            <PageHeader 
                title={STATIC_META.friendlyName} 
                description={STATIC_META.description} 
            >
                {/* Styled Buttons match Car Park UI */}
                <div className="flex gap-3">
                    <Button 
                        disabled={data.length === 0} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10 h-11 px-6 transition-all active:scale-95"
                    >
                        <FileSpreadsheet className="h-4 w-4 mr-2" /> Export CSV
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={() => window.print()} 
                        disabled={data.length === 0} 
                        className="h-11 border-indigo-200 text-indigo-700 hover:bg-indigo-50 px-6 transition-all"
                    >
                        <Printer className="h-4 w-4 mr-2" /> Print / PDF
                    </Button>
                </div>
            </PageHeader>

            {/* FILTER CARD (Matches Style) */}
            <Card className="bg-muted/20 border-dashed border-2 shadow-none">
                <CardContent className="py-6 px-6">
                    <div className="flex flex-col xl:flex-row gap-6 items-end">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                            {STATIC_META.parameters.map(param => renderInput(param))}
                        </div>
                        <div className="flex gap-3 shrink-0 w-full md:w-auto">
                            <Button 
                                onClick={() => setDynamicFilters({})} 
                                variant="ghost" 
                                className="h-11 text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="h-4 w-4 mr-2" /> Reset
                            </Button>
                            <Button 
                                onClick={() => runReport(1)} 
                                disabled={loading} 
                                className="h-11 px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 font-semibold transition-all hover:scale-[1.02]"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2 fill-current" />} 
                                Run Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* RESULTS TABLE */}
            <Card className="flex-1 flex flex-col min-h-[500px] overflow-hidden shadow-sm border-gray-200 dark:border-zinc-800">
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
                        <div className="p-6 border-t bg-muted/5 flex-shrink-0">
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