// components/themepark-support/tabs/Ticket/DeactivateTicketTab.tsx
"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Ticket, Loader2, SearchX } from "lucide-react" 
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { useToast } from "@/hooks/use-toast"
import { itPoswfService } from "@/services/themepark-support"
import { formatDateTime} from "@/lib/formatter";
import { cn } from "@/lib/utils"
import { 
  type DeactivatableTicket, 
  type ConsumptionHistory, 
} from "@/type/themepark-support"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"



export default function DeactivateTicketTab() {
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [ticketDetails, setTicketDetails] = useState<DeactivatableTicket[]>([])
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionHistory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deactivatingRow, setDeactivatingRow] = useState<ConsumptionHistory | null>(null)
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<string>>(new Set());

  // ... (fetchData and other handlers remain exactly the same) ...
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
                 toast({ title: "Search Complete", description: "No records found.", variant: "default" });
            } else {
                 toast({ 
                     title: "Search Complete", 
                     description: `Found ${ticketCount} tickets and ${consumeCount} consumption records.`,
                 });
            }
        }
        
    } catch (error) {
        console.error("Search Error:", error);
        if (!retainState) {
            toast({
                title: "Search Failed",
                description: "An unexpected error occurred during search.",
                variant: "destructive"
            });
        }
    } finally {
        if (!retainState) setIsSearching(false);
    }
  };

  const handleSearch = () => {
      if (!searchQuery.trim()) {
        toast({ title: "Input Required", description: "Please enter an Invoice or Ticket Number." });
        return;
      }
      fetchData(searchQuery.trim(), false);
  }

  const handleDeactivateClick = (row: ConsumptionHistory) => {
    const isActive = row.status.toLowerCase() === "active";
    if (!isActive) {
        toast({ title: "Invalid Status", description: "Item is already deactivated or invalid.", variant: "destructive" });
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
    try {
        const response = await itPoswfService.deactivateConsumption(deactivatingRow.consumptionNo);
        if (!response.success) throw new Error(response.error || "Deactivation failed.");
        await fetchData(searchQuery.trim(), true);
        toast({ title: "Success", description: `Consumption entry ${deactivatingRow.consumptionNo} deactivated.`, variant: "success" });
    } catch (error) {
        toast({ title: "Failed", description: error instanceof Error ? error.message : "Error occurred.", variant: "destructive" });
    } finally {
        setUpdatingRowIds(prev => { const next = new Set(prev); next.delete(rowId); return next; });
        setDeactivatingRow(null);
    }
  }

  const renderDeactivateButton = (row: ConsumptionHistory) => {
    const isAlreadyDeactivated = row.status.toLowerCase() !== "active";
    const isRowUpdating = updatingRowIds.has(row.id);
    return (
        <Button 
            variant="destructive" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); handleDeactivateClick(row); }} 
            disabled={isAlreadyDeactivated || isRowUpdating} 
            className="h-7 px-3 text-xs w-[100px]"
        >
            {isAlreadyDeactivated ? "Deactivate" : "Deactivate"}
        </Button>
    )
  }

  // --- UPDATED COLUMN DEFINITIONS WITH BADGE ---
  const masterColumns: TableColumn<DeactivatableTicket>[] = [
      { header: "Ticket No", accessor: "ticketNo", cell: (value, row) => {
          // Calculate the count of child consumption items for this ticket
          const childCount = consumptionHistory.filter(c => c.ticketNo === row.ticketNo).length;

          return (
            <div className="flex items-center gap-2">
                <span className="font-medium text-blue-600 dark:text-blue-400">{value}</span>
                {/* Only show badge if there are children */}
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
  ];

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
      <Card>
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

      {(ticketDetails.length > 0 || consumptionHistory.length > 0) && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
                <Ticket className="h-5 w-5 text-muted-foreground" />
                Ticket & Consumption Details
            </div>
            <DataTable 
                columns={masterColumns}
                data={ticketDetails}
                keyExtractor={(row) => row.ticketNo}
                renderSubComponent={renderDetailRow}
                isLoading={isSearching}
                emptyIcon={SearchX}
                emptyTitle="No Ticket Headers Found"
                emptyMessage="If you see this, we found consumption records but no parent ticket headers."
            />
          </CardContent>
        </Card>
      )}

      {isConfirmOpen && deactivatingRow && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deactivation</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to deactivate Consumption Entry <span className="font-medium text-foreground ml-1">{deactivatingRow.consumptionNo}</span>?<br/><br/>This action cannot be undone.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatingRowIds.has(deactivatingRow.id)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivateConfirm} disabled={updatingRowIds.has(deactivatingRow.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Deactivate</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}