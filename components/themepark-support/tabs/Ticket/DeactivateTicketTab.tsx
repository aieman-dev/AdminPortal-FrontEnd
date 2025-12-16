// components/themepark-support/tabs/Ticket/DeactivateTicketTab.tsx
"use client"

import React, { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Ticket, ChevronDown, ChevronRight, AlertCircle, History, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { itPoswfService } from "@/services/themepark-support"
import { cn } from "@/lib/utils"
import { 
  type DeactivatableTicket, 
  type ConsumptionHistory, 
} from "@/type/themepark-support"

const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString || dateString.startsWith('0001-01-01')) return '—';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 
    return date.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', 
      hour12: true,
    }).replace(',', ''); 
};

export default function DeactivateTicketTab() {
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [ticketDetails, setTicketDetails] = useState<DeactivatableTicket[]>([])
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionHistory[]>([])
  
  const [isSearching, setIsSearching] = useState(false)
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(new Set());
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deactivatingRow, setDeactivatingRow] = useState<ConsumptionHistory | null>(null)
  
  const [updatingRowIds, setUpdatingRowIds] = useState<Set<string>>(new Set());

  const toggleRowExpand = (ticketNo: string) => {
      const newSet = new Set(expandedTickets);
      if (newSet.has(ticketNo)) newSet.delete(ticketNo);
      else newSet.add(ticketNo);
      setExpandedTickets(newSet);
  };

  const fetchData = async (query: string, retainState: boolean = false) => {
    if (!query.trim()) return;

    if (!retainState) {
        setIsSearching(true);
        setTicketDetails([]);
        setConsumptionHistory([]);
        setExpandedTickets(new Set());
    }

    try {
        const [ticketResponse, consumptionResponse] = await Promise.all([
            itPoswfService.searchDeactivatableTickets(query),
            itPoswfService.searchConsumptionHistory(query)
        ]);

        if (ticketResponse.success && ticketResponse.data) {
            setTicketDetails(ticketResponse.data);
        }

        if (consumptionResponse.success && consumptionResponse.data) {
            setConsumptionHistory(consumptionResponse.data);
        }

        if (!retainState) {
            const ticketCount = ticketResponse.data?.length || 0;
            const consumeCount = consumptionResponse.data?.length || 0;

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

        if (!response.success) {
            throw new Error(response.error || "Deactivation failed.");
        }
        
        await fetchData(searchQuery.trim(), true);
        
        toast({ 
            title: "Success", 
            description: `Consumption entry ${deactivatingRow.consumptionNo} deactivated.`,
            variant: "success", 
        });
        
    } catch (error) {
        console.error("Deactivation Error:", error);
        toast({
            title: "Failed",
            description: error instanceof Error ? error.message : "Error occurred.",
            variant: "destructive"
        });
    } finally {
        setUpdatingRowIds(prev => {
            const next = new Set(prev);
            next.delete(rowId);
            return next;
        });
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
            onClick={(e) => {
                e.stopPropagation(); 
                handleDeactivateClick(row);
            }} 
            disabled={isAlreadyDeactivated || isRowUpdating} 
            className="h-7 px-3 text-xs w-[100px]"
        >
            {isAlreadyDeactivated ? "Deactivate" : "Deactivate"}
        </Button>
    )
  }

  const renderMasterDetailTable = () => (
    <div className="rounded-md border border-border overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="w-[140px]">Ticket No</TableHead>
            <TableHead className="w-[180px]">Transaction No</TableHead>
            <TableHead className="min-w-[200px]">Ticket Name</TableHead>
            <TableHead className="w-[100px] text-center pr-8">Total Qty</TableHead>
            <TableHead className="w-[180px]">Purchase Date</TableHead>
            <TableHead className="w-[120px] text-center">Status</TableHead>
            <TableHead className="w-[140px] "></TableHead> 
          </TableRow>
        </TableHeader>
        <TableBody>
          {ticketDetails.map((ticket) => {
            const children = consumptionHistory.filter(c => c.ticketNo === ticket.ticketNo);
            const isExpanded = expandedTickets.has(ticket.ticketNo);
            const hasChildren = children.length > 0;

            return (
              <React.Fragment key={ticket.id}>
                <TableRow 
                    className={cn(
                        "transition-colors border-b", 
                        hasChildren ? "cursor-pointer hover:bg-muted/30" : "opacity-80",
                        isExpanded && "bg-muted/30 border-b-0"
                    )}
                    onClick={() => hasChildren && toggleRowExpand(ticket.ticketNo)}
                >
                    <TableCell>
                        {hasChildren ? (
                            isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <div className="w-4" /> 
                        )}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-blue-600 dark:text-blue-400">
                                {ticket.ticketNo}
                            </span>
                            {children.length > 0 && (
                                <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-100 px-1 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                    {children.length}
                                </span>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{ticket.invoiceNo}</TableCell>
                    <TableCell className="font-medium">{ticket.ticketName}</TableCell>
                    <TableCell className="text-center w-[100px] pr-8">{ticket.quantity}</TableCell>
                    <TableCell className="text-muted-foreground text-sm w-[180px]">{formatDateTime(ticket.purchaseDate)}</TableCell>
                    <TableCell className="text-center w-[120px]"><StatusBadge status={ticket.status} /></TableCell>
                    <TableCell className="w-[140px]"></TableCell>
                </TableRow>

                {isExpanded && hasChildren && (
                    <TableRow className="bg-muted/10 hover:bg-muted/10 border-t-0 shadow-inner">
                        <TableCell colSpan={8} className="p-0">
                            <div className="py-2 pl-12 border-b border-border/50">
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
                                                    {isRowUpdating ? (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            Updating
                                                        </div>
                                                    ) : (
                                                        <StatusBadge status={child.status} className="h-5 text-[10px]" />
                                                    )}
                                                </div>
                                                
                                                <div className="w-[140px] flex justify-end pr-4">{renderDeactivateButton(child)}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </TableCell>
                    </TableRow>
                )}
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderFallbackConsumptionTable = () => (
    <div className="rounded-md border border-border">
        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-sm flex items-center gap-2 border-b border-amber-200 dark:border-amber-800">
            <AlertCircle className="h-4 w-4" />
            <span>Parent ticket information not found. Displaying raw consumption records.</span>
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Ticket No</TableHead>
                    <TableHead>Consumption No</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead className="text-center w-[120px]">Status</TableHead>
                    <TableHead className="text-right w-[140px]">Action</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {consumptionHistory.map(item => {
                    const isRowUpdating = updatingRowIds.has(item.id);
                    return (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.ticketNo}</TableCell>
                            <TableCell className="font-mono text-sm">{item.consumptionNo}</TableCell>
                            <TableCell>{item.ticketName}</TableCell>
                            <TableCell className="text-center w-[120px]">
                                {isRowUpdating ? (
                                    <div className="flex items-center justify-center">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <StatusBadge status={item.status} />
                                )}
                            </TableCell>
                            <TableCell className="text-right w-[140px]">{renderDeactivateButton(item)}</TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    </div>
  );

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

            {ticketDetails.length > 0 
                ? renderMasterDetailTable() 
                : renderFallbackConsumptionTable()
            }
          </CardContent>
        </Card>
      )}

      {isConfirmOpen && deactivatingRow && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deactivation</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to deactivate Consumption Entry 
                <span className="font-medium text-foreground ml-1">{deactivatingRow.consumptionNo}</span>?
                <br/><br/>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={updatingRowIds.has(deactivatingRow.id)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivateConfirm}
                disabled={updatingRowIds.has(deactivatingRow.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}