// components/themepark-support/tabs/Ticket/DeactivateTicketTab.tsx
"use client"

import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Ticket, Loader2, SearchX, ShoppingBag, FlaskConical } from "lucide-react" 
import { StatusBadge } from "@/components/shared-components/status-badge"
import { SearchField } from "@/components/shared-components/search-field"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { itPoswfService } from "@/services/themepark-support"
import { formatDateTime} from "@/lib/formatter";
import { cn } from "@/lib/utils"
import { 
  type DeactivatableTicket, 
  type ConsumptionHistory, 
} from "@/type/themepark-support"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { SimulationToggle } from "@/components/shared-components/simulation-toggle"
import { SimulationWrapper } from "@/components/shared-components/simulation-wrapper"


export default function DeactivateTicketTab() {
  const toast = useAppToast()
  const isMobile = useIsMobile()

  const [searchQuery, setSearchQuery] = useState("")
  const [ticketDetails, setTicketDetails] = useState<DeactivatableTicket[]>([])
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionHistory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deactivatingRow, setDeactivatingRow] = useState<ConsumptionHistory | null>(null)
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<string>>(new Set());

  // --- Mobile Sheet State ---
  const [selectedTicket, setSelectedTicket] = useState<DeactivatableTicket | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // --- SIMULATION STATE ---
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Core Fetch Logic
  const fetchData = async (query: string, retainState: boolean = false) => {
    if (!query.trim()) return;

    if (!retainState) {
        setIsSearching(true);
        setTicketDetails([]);
        setConsumptionHistory([]);
    }

    try {
        let [ticketResponse, consumptionResponse] = await Promise.all([
            itPoswfService.searchDeactivatableTickets(query),
            itPoswfService.searchConsumptionHistory(query)
        ]);

        let tickets = ticketResponse.data || [];
        const consumptions = consumptionResponse.data || [];

        if (tickets.length === 0 && consumptions.length > 0) {
            const uniqueTicketNos = Array.from(new Set(consumptions.map(c => c.ticketNo).filter(Boolean)));
            if (uniqueTicketNos.length > 0) {
                const secondaryResponses = await Promise.all(
                    uniqueTicketNos.map(tNo => itPoswfService.searchDeactivatableTickets(tNo))
                );
                secondaryResponses.forEach(resp => {
                    if (resp.success && resp.data) {
                        tickets = [...tickets, ...resp.data];
                    }
                });
                tickets = Array.from(new Map(tickets.map(t => [t.ticketNo, t])).values());
            }
        }

        if (ticketResponse.success || tickets.length > 0) {
            setTicketDetails(tickets);
        }

        if (consumptionResponse.success) {
            setConsumptionHistory(consumptions);
        }

        if (!retainState) {
            const ticketCount = tickets.length;
            const consumeCount = consumptions.length;

            if (ticketCount === 0 && consumeCount === 0) {
                 toast.info("Search Complete", "No records found.");
            } else {
                 toast.success("Search Complete", `Found ${ticketCount} tickets and ${consumeCount} consumption records.`);
            }
        }
        
    } catch (error) {
        console.error("Search Error:", error);
        if (!retainState) {
            toast.error("Search Failed", "An unexpected error occurred during search.");
        }
    } finally {
        if (!retainState) setIsSearching(false);
    }
  };

  // Auto Search Handler
  useAutoSearch((query) => {
      setSearchQuery(query);
      fetchData(query, false);
  });

  const handleSearch = () => {
      if (!searchQuery.trim()) {
        toast.info("Input Required", "Please enter an Invoice or Ticket Number.");
        return;
      }
      fetchData(searchQuery.trim(), false);
  }


  const handleDeactivateClick = (row: ConsumptionHistory) => {
    const isActive = row.status.toLowerCase() === "active";
    if (!isActive) {
        toast.error("Invalid Status", "Item is already deactivated or invalid.");
        return;
    }
    setDeactivatingRow(row)
    setIsConfirmOpen(true)
  }
  

  const handleDeactivateConfirm = async () => {
    if (!deactivatingRow) return;
    setIsConfirmOpen(false);

    const rowId = deactivatingRow.id;
    setUpdatingRowIds(prev => new Set(prev).add(rowId));

    // --- SIMULATION LOGIC ---
    if (isSimulating) {
        await new Promise(r => setTimeout(r, 800)); 

        setConsumptionHistory(prev => prev.map(c => 
            c.id === rowId ? { ...c, status: "Deactivated" } : c
        ));

        toast.success("Simulation Success", `Consumption entry ${deactivatingRow.consumptionNo} deactivated (Preview).`);
        
        setUpdatingRowIds(prev => { const next = new Set(prev); next.delete(rowId); return next; });
        setDeactivatingRow(null);
        return;
    }

    // --- REAL LOGIC ---
    try {
        const response = await itPoswfService.deactivateConsumption(deactivatingRow.consumptionNo);
        if (!response.success) throw new Error(response.error || "Deactivation failed.");
        await fetchData(searchQuery.trim(), true);
        toast.success("Success", `Consumption entry ${deactivatingRow.consumptionNo} deactivated.`);
    } catch (error) {
        toast.error("Failed", error instanceof Error ? error.message : "Error occurred.");
    } finally {
        setUpdatingRowIds(prev => { const next = new Set(prev); next.delete(rowId); return next; });
        setDeactivatingRow(null);
    }
  }

  // --- Render Helpers ---
  const renderDeactivateButton = (row: ConsumptionHistory) => {
    const isAlreadyDeactivated = row.status.toLowerCase() !== "active";
    const isRowUpdating = updatingRowIds.has(row.id);
    return (
        <LoadingButton 
            variant="destructive" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleDeactivateClick(row); }} 
            isLoading={isRowUpdating} 
            loadingText="Wait..."
            disabled={isAlreadyDeactivated || isRowUpdating} 
            className={cn("h-7 px-3 text-xs w-[100px]", isSimulating && "bg-amber-600 hover:bg-amber-700 text-white")}
        >
            {isAlreadyDeactivated ? "Deactivated" : isSimulating ? "Simulate" : "Deactivate"}
        </LoadingButton>
    )
  }

  // --- MOBILE HANDLER ---
  const handleRowClick = (ticket: DeactivatableTicket) => {
      setSelectedTicket(ticket);
      setIsSheetOpen(true);
  }

  // --- UPDATED COLUMN DEFINITIONS WITH BADGE ---
  const masterColumns: TableColumn<DeactivatableTicket>[] = useMemo(() => [
      { header: "Ticket No", accessor: "ticketNo", cell: (value, row) => {
          const childCount = consumptionHistory.filter(c => c.ticketNo === row.ticketNo).length;

          return (
            <div className="flex items-center gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">{value}</span>
                {childCount > 0 && (
                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-100 px-1 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                        {childCount}
                    </span>
                )}
            </div>
          );
      }},
      { header: "Transaction No", accessor: "invoiceNo", className: "text-muted-foreground" },
      { header: "Ticket Name", accessor: "ticketName", className: "min-w-[200px] font-medium" },
      { header: "Total Qty", accessor: "quantity", className: "text-center pr-8" },
      { header: "Purchase Date", accessor: "purchaseDate", cell: (value) => formatDateTime(value as string) },
      { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
  ], [consumptionHistory]);


  // --- DESKTOP SUB-COMPONENT ---
  const renderDetailRow = (ticket: DeactivatableTicket) => {
      const children = consumptionHistory.filter(c => c.ticketNo === ticket.ticketNo);
      if (children.length === 0) return <div className="py-4 pl-12 text-sm text-muted-foreground italic">No consumption history found for this ticket.</div>;

      return (
        <div className="py-2 pl-4 ml-8 border-l-2 border-gray-200 bg-gray-50/50 dark:bg-gray-900/10 rounded-r-md">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 pl-2 flex">
                <div className="w-[160px]">Consumption No</div>
                <div className="w-[140px]">Item No</div>
                <div className="flex-1">Item Name</div>
                <div className="w-[100px] text-center pr-8">Consumed Qty</div>
                <div className="w-[180px]">Modified Date</div>
                <div className="w-[120px] text-center">Status</div>
                <div className="w-[140px] text-center">Action</div>
            </div>
            <div className="flex flex-col">
                {children.map(child => {
                    const isRowUpdating = updatingRowIds.has(child.id);
                    return (
                        <div key={child.id} className="flex items-center text-sm py-2 pl-2 border-t border-border/30 first:border-0 hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
                            <div className="w-[160px] font-mono text-xs text-gray-600 truncate pr-2" title={child.consumptionNo}>{child.consumptionNo}</div>
                            <div className="w-[140px] text-xs text-muted-foreground truncate pr-2" title={child.ticketItemNo}>{child.ticketItemNo}</div>
                            <div className="flex-1 font-medium text-foreground/80 truncate pr-4" title={child.ticketName}>{child.ticketName}</div>
                            <div className="w-[100px] text-center text-sm pr-8">{child.consumeQty}</div>
                            <div className="w-[180px] text-xs text-muted-foreground">{formatDateTime(child.modifiedDate)}</div>
                            <div className="w-[120px] flex justify-center">
                                {isRowUpdating ? <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse"><Loader2 className="h-3 w-3 animate-spin" />Updating</div> : <StatusBadge status={child.status} className="h-5 text-[10px]" />}
                            </div>
                            <div className="w-[140px] flex justify-end pr-4">{renderDeactivateButton(child)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
      );
  };

  return (
    <>
    {/* Header with Toggle */}
      <div className="flex justify-end mb-4">
         <SimulationToggle isSimulating={isSimulating} onToggle={(val) => { 
             setIsSimulating(val);
             if (!val && searchQuery) fetchData(searchQuery, true);
         }} />
      </div>

      <SimulationWrapper isSimulating={isSimulating}>
          <Card className={cn(isSimulating && "border-amber-200 shadow-none bg-transparent")}>
            <CardContent>
            <SearchField
                label="Invoice No / Ticket No"
                placeholder="Enter Invoice or Ticket Number"
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
                isSearching={isSearching}
            />
            </CardContent>
        </Card>

        {(isSearching || ticketDetails.length > 0 || consumptionHistory.length > 0) && (
            <Card className={cn(isSimulating && "border-amber-200 shadow-none bg-transparent mt-4")}>
            <div className="p-6 border-b">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <Ticket className="h-5 w-5 text-muted-foreground" />
                        Ticket & Consumption Details
                    </div>
                </div>
                <CardContent className="p-0">
                    <DataTable 
                        columns={masterColumns}
                        data={ticketDetails}
                        keyExtractor={(row) => row.ticketNo}
                        isLoading={isSearching}
                        emptyIcon={SearchX}
                        emptyTitle="No Ticket Headers Found"
                        emptyMessage="If you see this, we found consumption records but no parent ticket headers."
                        renderSubComponent={isMobile ? undefined : renderDetailRow}
                        onRowClick={isMobile ? handleRowClick : undefined}
                    />
            </CardContent>
            </Card>
        )}
      </SimulationWrapper>

      {/* MOBILE SHEET FOR CONSUMPTION DETAILS */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full">
            {selectedTicket && (
                <>
                    <SheetHeader className="p-6 border-b bg-muted/10">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-indigo-600" />
                            Consumption History
                        </SheetTitle>
                        <SheetDescription>
                            Ticket: <span className="font-mono font-medium text-foreground">{selectedTicket.ticketNo}</span>
                        </SheetDescription>
                    </SheetHeader>
                    
                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-4">
                            {consumptionHistory.filter(c => c.ticketNo === selectedTicket.ticketNo).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">No consumption history found.</div>
                            ) : (
                                consumptionHistory.filter(c => c.ticketNo === selectedTicket.ticketNo).map((child, idx) => (
                                    <div key={child.id} className="p-4 rounded-lg border bg-card shadow-sm flex flex-col gap-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <div className="text-xs text-muted-foreground font-mono">#{child.consumptionNo}</div>
                                                <div className="text-sm font-medium">{child.ticketName}</div>
                                            </div>
                                            <StatusBadge status={child.status} className="h-5 text-[10px]" />
                                        </div>
                                        
                                        <Separator />
                                        
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Quantity Consumed:</span>
                                            <span className="font-bold">{child.consumeQty}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Date:</span>
                                            <span>{formatDateTime(child.modifiedDate)}</span>
                                        </div>

                                        <div className="pt-2">
                                            <Button 
                                                variant="destructive" 
                                                size="sm" 
                                                className={cn("w-full", isSimulating && "bg-amber-600 hover:bg-amber-700 text-white")}
                                                disabled={child.status.toLowerCase() !== "active" || updatingRowIds.has(child.id)}
                                                onClick={() => {
                                                    setDeactivatingRow(child);
                                                    setIsConfirmOpen(true);
                                                }}
                                            >
                                                {updatingRowIds.has(child.id) ? <Loader2 className="h-4 w-4 animate-spin" /> : isSimulating ? "Simulate Deactivate" : "Deactivate Entry"}
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                    <div className="p-6 border-t">
                        <Button className="w-full" variant="outline" onClick={() => setIsSheetOpen(false)}>Close</Button>
                    </div>
                </>
            )}
        </SheetContent>
      </Sheet>

      {/* CONFIRMATION DIALOG */}
      {isConfirmOpen && deactivatingRow && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent className={cn(isSimulating && "border-amber-200")}>
            <AlertDialogHeader>
              <AlertDialogTitle className={cn(isSimulating && "text-amber-700 flex items-center gap-2")}>
                  {isSimulating && <FlaskConical className="h-5 w-5" />}
                  {isSimulating ? "Simulate Deactivation?" : "Confirm Deactivation"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isSimulating ? (
                    <span>
                        You are about to simulate deactivating Consumption Entry <span className="font-medium text-foreground ml-1">{deactivatingRow.consumptionNo}</span>.
                        <br/>The status will update locally for preview purposes only.
                    </span>
                ) : (
                    <span>
                        Are you sure you want to deactivate Consumption Entry <span className="font-medium text-foreground ml-1">{deactivatingRow.consumptionNo}</span>?
                        <br/><br/>This action cannot be undone.
                    </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatingRowIds.has(deactivatingRow.id)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                  onClick={handleDeactivateConfirm} 
                  disabled={updatingRowIds.has(deactivatingRow.id)} 
                  className={cn(isSimulating ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
              >
                  {isSimulating ? "Run Simulation" : "Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}