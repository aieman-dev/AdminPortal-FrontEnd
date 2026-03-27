"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls"
import { Shield, Search, Play, RotateCcw, Activity, Filter } from "lucide-react"
import { usePagination } from "@/hooks/use-pagination"
import { staffService } from "@/services/staff-services"
import { type AuditLog, AuditLogListPayload } from "@/type/staff"
import { formatDate } from "@/lib/formatter"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
    Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetDescription 
} from "@/components/ui/sheet"
import { logger } from "@/lib/logger"

// --- RESTORED ORIGINAL HELPERS ---

const formatActionName = (technicalName: string): string => {
    if (!technicalName) return "Unknown Action";
    let clean = technicalName.replace(/^(POST|GET|PUT|DELETE|PATCH)\s?-\s?/i, "");
    clean = clean.replace(/([a-z])([A-Z])/g, '$1 $2');
    return clean.trim();
};

const parseDescription = (rawDesc: string) => {
    if (!rawDesc) return "No details provided";
    const outputIndex = rawDesc.indexOf("Output:");
    if (outputIndex === -1) return rawDesc.replace("Action:", "").trim();
    const jsonString = rawDesc.slice(outputIndex + 7).trim(); 
    try {
        const data = JSON.parse(jsonString);
        if (Array.isArray(data)) return `Retrieved ${data.length} records.`;
        if (typeof data === 'object' && data !== null) {
            if (data.message) return data.message;
            return "Operation successful.";
        }
        return "Action completed.";
    } catch {
        return "Action completed (See details).";
    }
};

const getActionStyle = (actionType: string) => {
    const lower = actionType.toLowerCase();
    
    if (lower.includes("void") || lower.includes("block") || lower.includes("deactivate") || 
        lower.includes("reject") || lower.includes("remove") || lower.includes("delete")) {
        return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
    }

    if (lower.includes("create") || lower.includes("register") || lower.includes("approve") || 
        lower.includes("activate") || lower.includes("unblock") || lower.includes("reactivate") || lower.includes("upload")) {
        return "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400";
    }

    if (lower.includes("update") || lower.includes("sync") || lower.includes("assign") || 
        lower.includes("exchange") || lower.includes("link")) {
        return "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800";
    }

    if (lower.includes("reset") || lower.includes("toggle") || lower.includes("generate")) {
        return "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800";
    }

    return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"; 
};

// --- MODULE FORMATTING & CELL COMPONENT ---

const formatModuleName = (mod: string) => {
    // For the Dropdown: Clearly label the Themepark group
    if (["Transaction", "Ticket", "Attraction", "Account", "Support"].includes(mod)) {
        return `Themepark Support: ${mod}`;
    }
    // For others: Split CamelCase (e.g., HrManagement -> Hr Management)
    return mod.replace(/([A-Z])/g, ' $1').trim();
};

const ModuleCell = ({ moduleName }: { moduleName: string }) => {
    const mod = moduleName || "SYSTEM";
    const isThemepark = ["Transaction", "Ticket", "Attraction", "Account", "Support"].includes(mod);

    if (isThemepark) {
        return (
            <TooltipProvider delayDuration={200}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        {/* Cursor-help indicates it is hoverable. We added a tiny dot inside the pill! */}
                        <span className="cursor-help inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            {mod}
                        </span>
                    </TooltipTrigger>
                    {/* The sleek tooltip that appears on hover */}
                    <TooltipContent side="top" className="bg-indigo-600 text-white font-medium text-xs px-2.5 py-1">
                        Themepark Support 
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    // Standard Layout (For Package Management, HR Management, etc.)
    return (
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded">
            {formatModuleName(mod)}
        </span>
    );
};

// --- COMPONENT ---

export default function ActivityAuditTab({ onRowClick }: { onRowClick: (log: AuditLog) => void }) {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const pager = usePagination({ pageSize: 20 });

    const [searchQuery, setSearchQuery] = useState("")
    const debouncedSearch = useDebounce(searchQuery, 500)

    const [moduleFilter, setModuleFilter] = useState("all")
    const [availableModules, setAvailableModules] = useState<string[]>([])

    const [startDate, setStartDate] = useState<Date | undefined>(undefined)
    const [endDate, setEndDate] = useState<Date | undefined>(undefined)

    const [isFilterOpen, setIsFilterOpen] = useState(false)

    const fetchLogs = useCallback(async (pageNum: number) => {
        setIsLoading(true)
        if (pageNum !== pager.currentPage) pager.setCurrentPage(pageNum);

        try {
            const payload: AuditLogListPayload= {
                searchQuery: searchQuery.trim(),
                pageNumber: pageNum,
                pageSize: pager.pageSize
            };

            if (moduleFilter !== "all") {
                payload.module = moduleFilter;
            }

            if (startDate) {
                const startStr = new Date(startDate);
                startStr.setHours(0, 0, 0, 0);
                payload.startDate = startStr.toISOString(); 
            }
            
            if (endDate) {
                const endStr = new Date(endDate);
                endStr.setHours(23, 59, 59, 999);
                payload.endDate = endStr.toISOString();
            }

            const data = await staffService.getAllAuditLogs(payload);
            if (data) {
                setLogs(data.logs);
                pager.setMetaData(data.totalPages, data.totalRecords);
            }
        } catch (e) { 
            logger.error("Failed to fetch audit logs", { error: e });
        } finally { 
            setIsLoading(false) 
        }
    }, [debouncedSearch, moduleFilter, startDate, endDate, pager.pageSize])


    // Load available modules for filter dropdown
    useEffect(() => {
        const loadModules = async () => {
            const modules = await staffService.getAuditModules();
            setAvailableModules(modules);
        };
        loadModules();
    }, []);

    // Auto-search effect
    useEffect(() => {
        pager.setCurrentPage(1);
        fetchLogs(1)
    }, [debouncedSearch, moduleFilter, startDate, endDate])

    const handleReset = () => {
        setSearchQuery("");
        setModuleFilter("all");
        setStartDate(undefined)
        setEndDate(undefined)
        setIsFilterOpen(false)
    }

    const handleMobileRun = () => {
        fetchLogs(1);
        setIsFilterOpen(false); 
    }

    const activeFilterCount = [
        moduleFilter !== "all",
        startDate !== undefined,
        endDate !== undefined
    ].filter(Boolean).length;

    const columns: TableColumn<AuditLog>[] = useMemo(() => [
        { 
            header: "Activity", accessor: "actionType", className: "w-[250px] pl-6",
            cell: (val) => {
                const readable = formatActionName(val as string);
                const style = getActionStyle(val as string);
                return (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border ${style}`}>
                        {readable}
                    </span>
                );
            }
        },
        { 
            header: "User", accessor: "userName", 
            cell: (val, row) => (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{val || "Unknown"}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">ID: {row.userId}</span>
                </div>
            )
        },
        { 
            header: "Description / Details", accessor: "description", 
            cell: (val) => {
                const cleanText = parseDescription(val as string);
                return <span className="text-sm text-foreground truncate max-w-[400px] block" title={cleanText}>{cleanText}</span>
            }
        },
        { 
            header: "Module", accessor: "module", className: "text-center",
            cell: (val) => <ModuleCell moduleName={val as string} />
        },
        { 
            header: "Timestamp", accessor: "timestamp", className: "text-right pr-6",
            cell: (val) => (
                <div className="flex flex-col items-end">
                    <span className="text-xs font-medium">{formatDate(val as string)}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{new Date(val as string).toLocaleTimeString()}</span>
                </div>
            )
        }
    ], []);

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="px-6 pt-2 pb-0">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 mb-4">
                        <Activity className="h-4 w-4 text-blue-500" /> 
                        Live System Audit
                    </CardTitle>
                    
                    {/* === 1. MOBILE FILTER VIEW (Visible < md) === */}
                    <div className="flex md:hidden gap-2 items-center pb-4">
                        <div className="relative flex-1">
                            <Input 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search actions" 
                                className="w-full h-11 pl-9 bg-background shadow-sm border-gray-200 dark:border-gray-800"
                            />
                            <Search size={18} className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                            <SheetTrigger asChild>
                                <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 bg-background border-input relative">
                                    <Filter className="h-4 w-4 text-foreground" />
                                    {activeFilterCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-600 rounded-full border-2 border-background" />
                                    )}
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="rounded-t-xl px-0">
                                <SheetHeader className="px-6 border-b pb-4">
                                    <SheetTitle>Filter Logs</SheetTitle>
                                    <SheetDescription>Refine by module or date range.</SheetDescription>
                                </SheetHeader>
                                <div className="p-6 space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none text-foreground/80 uppercase">Module</label>
                                        <Select value={moduleFilter} onValueChange={setModuleFilter}>
                                            <SelectTrigger className="w-full h-11">
                                                <SelectValue placeholder="All Modules" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">All Modules</SelectItem>
                                                    {availableModules.map((mod) => (
                                                        <SelectItem key={mod} value={mod}>
                                                            {formatModuleName(mod)}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium leading-none text-foreground/80">Date Range</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <DatePicker date={startDate} setDate={setStartDate} placeholder="Start" className="h-11" />
                                            <DatePicker date={endDate} setDate={setEndDate} placeholder="End" className="h-11" />
                                        </div>
                                    </div>
                                </div>
                                <SheetFooter className="flex-row gap-3 pt-4 px-6 border-t mt-auto absolute bottom-6 w-full">
                                    <Button variant="outline" className="flex-1 h-12" onClick={handleReset}>Reset</Button>
                                    <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleMobileRun}>Run</Button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>

                    {/* === 2. DESKTOP FILTER VIEW (Hidden < md) === */}
                    <div className="hidden md:flex flex-row gap-3 items-center justify-between pb-4">
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                                <Input 
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search actions or users" 
                                    className="w-full h-11 pl-9 bg-muted/50 border-transparent focus:bg-background"
                                />
                            </div>
                            <div className="w-[140px]">
                                <Select value={moduleFilter} onValueChange={setModuleFilter}>
                                    <SelectTrigger className="w-full h-11 bg-muted/50 border-transparent hover:bg-muted/80 ">
                                        <SelectValue placeholder="Module" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Modules</SelectItem>
                                            {availableModules.map((mod) => (
                                                <SelectItem key={mod} value={mod}>
                                                    {formatModuleName(mod)}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <div className="w-[145px]">
                                    <DatePicker date={startDate} setDate={setStartDate} placeholder="Start Date" className="h-11 bg-muted/50 border-transparent focus:bg-background" />
                                </div>
                                <div className="w-[145px]">
                                    <DatePicker date={endDate} setDate={setEndDate} placeholder="End Date" className="h-11 bg-muted/50 border-transparent focus:bg-background" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={handleReset} className="h-11 text-muted-foreground hover:text-foreground ">
                                <RotateCcw size={12} className="mr-2" /> Reset
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-0 border-t">
                    <DataTable 
                        columns={columns} 
                        data={logs} 
                        keyExtractor={(row, i) => `${row.id}-${i}`}
                        isLoading={isLoading} 
                        emptyIcon={Shield} 
                        onRowClick={onRowClick}
                    />
                    <div className="p-4 border-t bg-background">
                        <PaginationControls {...pager.paginationProps} onPageChange={fetchLogs} />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}