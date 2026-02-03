"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { History, Calendar as CalendarIcon, Loader2, SearchX, LogOut, Search, Play, RotateCcw, AlertTriangle} from "lucide-react"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { carParkService } from "@/services/car-park-services"
import { ParkingActivity } from "@/type/car-park"
import { StatusBadge } from "@/components/shared-components/status-badge" // Centralized Badge
import { PaginationControls } from "@/components/ui/pagination-controls"
import { startOfMonth, endOfMonth, addDays } from "date-fns"
import { formatDateTime } from "@/lib/formatter"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAuth } from "@/hooks/use-auth" 
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ParkingActivityHistoryProps {
    accId: number;
}

export function ParkingActivityHistory({ accId }: ParkingActivityHistoryProps) {
    const toast = useAppToast()
    const { user } = useAuth()

    const [history, setHistory] = useState<ParkingActivity[]>([])
    const [loading, setLoading] = useState(false)

    // Force Exit State
    const [isForceExitOpen, setIsForceExitOpen] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<ParkingActivity | null>(null)
    const [isProcessingExit, setIsProcessingExit] = useState(false)
    
    // --- FILTERS ---
    const [dateRange, setDateRange] = useState<{ start: Date | undefined, end: Date | undefined }>({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date())
    })
    
    // --- PAGINATION ---
    const [currentPage, setCurrentPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [totalRecords, setTotalRecords] = useState(0)
    const PAGE_SIZE = 10;

    // --- FETCH DATA ---
    const fetchHistory = async (page: number) => {
        if (!accId) return;
        setLoading(true);
        
        try {
            const start = dateRange.start ? dateRange.start.toISOString() : addDays(new Date(), -30).toISOString();
            const end = dateRange.end ? dateRange.end.toISOString() : new Date().toISOString();

            const response = await carParkService.getParkingHistory({
                pageNumber: page,
                pageSize: PAGE_SIZE,
                accId: accId,
                startDate: start,
                endDate: end
            });

            setHistory(response.items);
            setTotalPages(response.totalPages);
            setTotalRecords(response.totalCount);
            setCurrentPage(response.pageNumber);

        } catch (error) {
            console.error("History fetch error:", error);
            toast.error("Error", "Failed to load parking history.");
        } finally {
            setLoading(false);
        }
    };

   useEffect(() => {
        if(accId) fetchHistory(1);
    }, [accId, dateRange]);

    const handleReset = () => {
        setDateRange({
            start: startOfMonth(new Date()),
            end: endOfMonth(new Date())
        });
    };

    const onForceExitClick = (row: ParkingActivity) => {
        setSelectedActivity(row);
        setIsForceExitOpen(true);
    }

    const confirmForceExit = async () => {
        if (!selectedActivity) return;

        setIsProcessingExit(true);
        try {
            const adminId = Number(user?.id || 0);
            
            await carParkService.forceExit(
                selectedActivity.rParkingID,
                accId,
                adminId,
                selectedActivity.plateNo
            );
            
            toast.success("Success", `Force exit successful for ${selectedActivity.plateNo}.`);
            setIsForceExitOpen(false);
            
            fetchHistory(currentPage);

        } catch (error) {
            toast.error("Action Failed", error instanceof Error ? error.message : "Failed to force exit.");
        } finally {
            setIsProcessingExit(false);
        }
    }

    const columns: TableColumn<ParkingActivity>[] = [
        { 
            header: "Entry Time", 
            accessor: "entryTime",
            className: "pl-6 min-w-[150px]",
            cell: (val) => {
                const formatted = val ? formatDateTime(val as string) : "-";
                const parts = formatted.includes(',') ? formatted.split(',') : [formatted];
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{parts[0]}</span>
                        <span className="text-xs text-muted-foreground">{parts[1] || ""}</span>
                    </div>
                )
            }
        },
        { 
            header: "Exit Time", 
            accessor: "exitTime",
            cell: (val) => {
                const formatted = val ? formatDateTime(val as string) : "-";
                if (!val) return <span className="text-muted-foreground">-</span>;
                const parts = formatted.includes(',') ? formatted.split(',') : [formatted];
                return (
                    <div className="flex flex-col">
                        <span className="text-sm text-foreground">{parts[0]}</span>
                        <span className="text-xs text-muted-foreground">{parts[1] || ""}</span>
                    </div>
                )
            }
        },
        { 
            header: "Gate Info", 
            accessor: "entryGate",
            cell: (val, row) => (
                <div className="flex flex-col gap-1 text-xs">
                    <div className="text-muted-foreground">In: <span className="text-foreground">{val}</span></div>
                    <div className="text-muted-foreground">Out: <span className="text-foreground">{row.exitGate || "-"}</span></div>
                </div>
            )
        },
        { 
            header: "Plate No", 
            accessor: "plateNo", 
            cell: (val) => (
                <span className="font-mono text-xs font-normal uppercase bg-muted/30 px-2 py-1 rounded border border-border/50 text-foreground">
                    {val}
                </span>
            )
        },
        { 
            header: "Duration", 
            accessor: "duration",
            className: "text-right text-xs text-muted-foreground",
            cell: (val) => val || "-"
        },
        { 
            header: "Status", 
            accessor: "status", 
            className: "text-center px-4",
            cell: (val) => <StatusBadge status={val as string} /> 
        },
        {
            header: "Action",
            accessor: "rParkingID",
            className: "text-right pr-6",
            cell: (_, row) => {
                const isOngoing = 
                    !row.exitTime || 
                    row.exitTime === "-" || 
                    !row.exitGate || 
                    (row.status || "").toLowerCase() === "parked";
                
                return (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        disabled={!isOngoing}
                        onClick={() => onForceExitClick(row)}
                        className={`h-8 px-2 text-xs ${
                            isOngoing 
                                ? "text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" 
                                : "text-muted-foreground opacity-30 cursor-not-allowed"
                        }`}
                    >
                        <LogOut className="h-3.5 w-3.5 mr-1.5" />
                        Force Exit
                    </Button>
                )
            }
        }
    ];

    return (
        <>
        <Card className="w-full shadow-sm border border-gray-200 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="bg-gray-50/50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 pb-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <History className="h-5 w-5 text-indigo-600 dark:text-indigo-400" /> 
                            Parking History
                        </CardTitle>
                        <CardDescription>Records of entry and exit events.</CardDescription>
                    </div>

                    {/* Filters Toolbar (Reused Layout from PackageFilters) */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-2">
                        
                        {/* Dates & Actions */}
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                            <div className="w-[140px]">
                                <DatePicker 
                                    date={dateRange.start} 
                                    setDate={(d) => setDateRange(prev => ({...prev, start: d}))} 
                                    placeholder="Start Date" 
                                    className="h-9 bg-background"
                                />
                            </div>
                            <div className="w-[140px]">
                                <DatePicker 
                                    date={dateRange.end} 
                                    setDate={(d) => setDateRange(prev => ({...prev, end: d}))} 
                                    placeholder="End Date"
                                    className="h-9 bg-background"
                                />
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleReset} className="h-9 text-muted-foreground hover:text-foreground">
                                <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset
                            </Button>
                        </div>
                    </div>
                </div>
            </CardHeader>


            <CardContent className="p-0">
                <DataTable 
                    columns={columns}
                    data={history}
                    keyExtractor={(row) => row.rParkingID.toString()}
                    isLoading={loading}
                    emptyIcon={SearchX}
                    emptyTitle="No Activity Found"
                    emptyMessage="No parking records found for the selected date range."
                />
                
                {totalPages > 1 && (
                    <div className="p-4 border-t bg-muted/5">
                        <PaginationControls 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalRecords={totalRecords}
                            pageSize={PAGE_SIZE}
                            onPageChange={fetchHistory}
                        />
                    </div>
                )}
            </CardContent>
        </Card>

        {/* Confirmation Dialog */}
            <AlertDialog open={isForceExitOpen} onOpenChange={setIsForceExitOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-5 w-5" />
                            Confirm Force Exit
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to force exit for plate 
                            <strong className="text-foreground ml-1">{selectedActivity?.plateNo}</strong>?
                            <br/><br/>
                            This will close the parking session immediately.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isProcessingExit}>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={(e) => {
                                e.preventDefault();
                                confirmForceExit();
                            }}
                            disabled={isProcessingExit}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {isProcessingExit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Force Exit
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}