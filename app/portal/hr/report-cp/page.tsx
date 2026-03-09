"use client"

import { useState, useCallback } from "react"
import { Play, Printer, FileSpreadsheet, Loader2, FileText, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { useAppToast } from "@/hooks/use-app-toast"
import { hrService } from "@/services/hr-services" 
import { PageHeader } from "@/components/portal/page-header"
import { usePagination } from "@/hooks/use-pagination"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/lib/formatter"

// --- 1. STATIC CONFIGURATION ---
const STATIC_META = {
    friendlyName: "Staff Parking Listing",
    description: "View staff parking records by Account ID.",
    parameters: [
        {
            name: "SearchQuery",
            label: "Search", // Shortened label for mobile
            type: "text",
            placeholder: "Name, Staff ID, or Plate"
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
            ),
            cell: (val: any) => {
                 if (typeof val === 'string' && val.includes('T') && val.length > 10 && !isNaN(Date.parse(val))) {
                     return <span className="whitespace-nowrap">{formatDateTime(val)}</span>;
                 }
                 if (key.toLowerCase().includes("status")) {
                     return <StatusBadge status={val} />;
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
            const { SearchQuery, ...otherParams } = dynamicFilters;
            const response = await hrService.generateReport({
                reportName: "report_CarPark_StaffListing",
                pageNumber: page,
                pageSize: pagination.pageSize,
                SearchQuery: SearchQuery, 
                parameters: otherParams 
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

    // --- 4. RENDER INPUTS ---
    const renderInput = (param: any) => {
        const value = dynamicFilters[param.name];
        // Optimized input style for mobile touch targets (h-10)
        const inputClass = "h-10 md:h-11 bg-background border-input shadow-sm focus:border-indigo-500 focus:ring-indigo-500/20 transition-all text-sm";
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
        // Reduced padding (p-3) and spacing (space-y-4) for mobile
        <div className="flex flex-col space-y-4 md:space-y-8 p-3 md:p-8 animate-in fade-in duration-500 pb-20 md:pb-8">
            
            <PageHeader 
                title={STATIC_META.friendlyName} 
                description={STATIC_META.description} 
            >
                {/* Responsive Actions: Stack on very small screens, row on others */}
                <div className="flex items-center gap-2 mt-2 md:mt-0">
                    <Button 
                        disabled={data.length === 0} 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-9 md:h-11 px-4 text-xs md:text-sm font-medium flex-1 md:flex-none"
                    >
                        <FileSpreadsheet className="h-3.5 w-3.5 mr-2" /> 
                        <span className="hidden sm:inline">Export</span> CSV
                    </Button>
                    
                    {/* Icon-only button on mobile to save space */}
                    <Button 
                        variant="outline" 
                        onClick={() => window.print()} 
                        disabled={data.length === 0} 
                        className="h-9 md:h-11 w-9 md:w-auto md:px-6 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                        title="Print"
                    >
                        <Printer className="h-4 w-4 md:mr-2" /> 
                        <span className="hidden md:inline">Print</span>
                    </Button>
                </div>
            </PageHeader>

            {/* FILTER CARD - Compact Mobile View */}
            <Card className="bg-muted/20 border-2 border-dashed md:border-dashed border-border/60 shadow-none">
                <CardContent className="py-4 px-4 md:py-6 md:px-6">
                    <div className="flex flex-col xl:flex-row gap-4 md:gap-6 items-end">
                        
                        {/* Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 w-full">
                            {STATIC_META.parameters.map(param => renderInput(param))}
                        </div>

                        {/* Action Buttons - Full width on mobile */}
                        <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                            <Button 
                                onClick={() => setDynamicFilters({})} 
                                variant="ghost" 
                                className="h-10 md:h-11 flex-1 md:flex-none text-muted-foreground hover:text-foreground"
                            >
                                <RotateCcw className="h-4 w-4 md:mr-2" /> 
                                <span className="hidden md:inline">Reset</span>
                            </Button>
                            
                            <Button 
                                onClick={() => runReport(1)} 
                                disabled={loading} 
                                className="h-10 md:h-11 px-6 md:px-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md font-semibold flex-[2] md:flex-none"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 mr-2 fill-current" />} 
                                Run
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* RESULTS TABLE */}
            <Card className="flex-1 flex flex-col min-h-[400px] overflow-hidden shadow-sm border-gray-200 dark:border-zinc-800">
                <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="flex-1 overflow-auto scrollbar-hide">
                        <DataTable 
                            columns={columns}
                            data={data}
                            keyExtractor={(_, index) => `row-${index}`}
                            isLoading={loading}
                            emptyTitle="No Data Generated"
                            emptyMessage='Click "Run" to see results.'
                            emptyIcon={FileText}
                            pagination={{
                                currentPage: pagination.currentPage,
                                totalPages: pagination.totalPages,
                                totalRecords: pagination.totalRecords,
                                pageSize: pagination.pageSize,
                                onPageChange: (page) => runReport(page)
                            }}
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}