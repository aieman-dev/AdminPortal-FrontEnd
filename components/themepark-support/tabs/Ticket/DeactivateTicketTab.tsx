// components/themepark-support/tabs/Ticket/DeactivateTicketTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Search, X, History, Ticket } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { useToast } from "@/hooks/use-toast"
import { itPoswfService } from "@/services/themepark-support"
import { 
  type DeactivatableTicket, 
  type ConsumptionHistory, 
} from "@/type/themepark-support"

const formatDateTime = (dateString: string | undefined): string => {
    if (!dateString || dateString.startsWith('0001-01-01')) return '—';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; 

    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit', 
      hour12: true,
    }).replace(',', ''); 
};

export default function DeactivateTicketTab() {
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  // USE REAL TYPES
  const [ticketDetails, setTicketDetails] = useState<DeactivatableTicket[]>([])
  const [consumptionHistory, setConsumptionHistory] = useState<ConsumptionHistory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  // Use a generic interface that covers the common fields needed for confirmation
  const [deactivatingRow, setDeactivatingRow] = useState<any | null>(null)
  const [deactivatingType, setDeactivatingType] = useState<"ticket" | "consumption" | null>(null)
  const [isDeactivating, setIsDeactivating] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Input Required", description: "Please enter an Invoice or Ticket Number." });
      return;
    }
    
    setIsSearching(true)
    setTicketDetails([])
    setConsumptionHistory([])
    
    try {
        const search = searchQuery.trim();
        let consumptionData: ConsumptionHistory[] = [];
        
        // 1. Search for main tickets
        const ticketResponse = await itPoswfService.searchDeactivatableTickets(search);
        
        if (ticketResponse.success && ticketResponse.data && ticketResponse.data.length > 0) {
            setTicketDetails(ticketResponse.data);
            
            // 2. If tickets found, search consumption history using the first ticket's No and the original search query
            const firstTicket = ticketResponse.data[0];
            const consumptionResponse = await itPoswfService.searchConsumptionHistory(
                search, 
                firstTicket.ticketNo
            );
            
            if (consumptionResponse.success && consumptionResponse.data) {
                consumptionData = consumptionResponse.data;
            }
            
            toast({ 
                title: "Search Complete", 
                description: `Found ${ticketResponse.data.length} tickets.`,
                variant: "default", 
                duration: 5000,    
            });
            
        } else {
             // 3. If no tickets found, still check consumption just by the search query (invoice/ticket number)
            const consumptionResponse = await itPoswfService.searchConsumptionHistory(search);

            if (consumptionResponse.success && consumptionResponse.data) {
                 consumptionData = consumptionResponse.data;
                 if (consumptionData.length > 0) {
                     toast({ 
                         title: "Search Complete", 
                         description: `Found ${consumptionData.length} consumption records, but no main ticket.`,
                         variant: "default", 
                         duration: 5000,    
                     });
                 } else {
                      toast({ 
                          title: "Search Complete", 
                          description: "No active ticket or consumption records found.",
                          variant: "default", 
                          duration: 5000,
                      });
                 }
            } else {
                 toast({ 
                     title: "Search Complete", 
                     description: "No active ticket or consumption records found.",
                     variant: "default", 
                     duration: 5000,
                 });
            }
        }
        
        setConsumptionHistory(consumptionData);
        
    } catch (error) {
        console.error("Search Error:", error);
        toast({
            title: "Search Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred during search.",
            variant: "destructive"
        });
    } finally {
        setIsSearching(false);
    }
  }

  const handleDeactivateClick = (row: DeactivatableTicket | ConsumptionHistory, type: "ticket" | "consumption") => {
    const statusField = type === "ticket" ? (row as DeactivatableTicket).status : (row as ConsumptionHistory).status;
    
    const isActive = statusField.toLowerCase() === "active";
    
    if (!isActive) {
        toast({ title: "Invalid Status", description: "Item is already deactivated, expired, or cancelled.", variant: "destructive" });
        return;
    }
    setDeactivatingRow(row)
    setDeactivatingType(type)
    setIsConfirmOpen(true)
  }
  
  const handleDeactivateConfirm = async () => {
    if (!deactivatingRow || !deactivatingType) return;
    
    setIsConfirmOpen(false)
    setIsDeactivating(true)
    
    try {
        let response;
        if (deactivatingType === "ticket") {
            const ticketRow = deactivatingRow as DeactivatableTicket;
            response = await itPoswfService.deactivateTicket(ticketRow.ticketID);
        } else { // consumption
            const consumptionRow = deactivatingRow as ConsumptionHistory;
            response = await itPoswfService.deactivateConsumption(consumptionRow.consumptionNo);
        }

        if (!response.success) {
            throw new Error(response.error || "Deactivation failed on the server.");
        }
        
        // Update local state on success
        if (deactivatingType === "ticket") {
            const ticketRow = deactivatingRow as DeactivatableTicket;
            setTicketDetails(prev => prev.map(t => t.id === ticketRow.id ? { ...t, status: "Deactivated" as const } : t));
            
            // Also update all associated consumption records to reflect a system-wide deactivation
            setConsumptionHistory(prev => prev.map(c => 
                c.ticketNo === ticketRow.ticketNo ? { ...c, status: "Deactivated" as const } : c
            ));

        } else { // consumption
            const consumptionRow = deactivatingRow as ConsumptionHistory;
            setConsumptionHistory(prev => prev.map(c => 
                c.id === consumptionRow.id ? { ...c, status: "Deactivated" as const } : c
            ));
        }
        
        toast({ 
            title: "Deactivation Success", 
            description: `${deactivatingType === "ticket" ? "Ticket" : "Consumption entry"} ${deactivatingRow.id} has been deactivated.`,
            variant: "success", 
            duration: 5000,    
        });
        

    } catch (error) {
        console.error("Deactivation Error:", error);
        toast({
            title: "Deactivation Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
            variant: "destructive"
        }); // Keep duration omitted for error (defaults to long/infinite)
    } finally {
        setIsDeactivating(false);
    }
  }


  const renderDeactivateButton = (row: DeactivatableTicket | ConsumptionHistory, type: "ticket" | "consumption") => {
    const statusField = type === "ticket" ? (row as DeactivatableTicket).status : (row as ConsumptionHistory).status;
    
    // Check for both "Deactivated" and "Inactive" status
    const isAlreadyDeactivated = statusField.toLowerCase() === "deactivated" || statusField.toLowerCase() === "inactive";
    
    return (
        <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleDeactivateClick(row, type)} 
            disabled={isAlreadyDeactivated || isDeactivating} 
        >
            <X className="h-4 w-4 mr-2" />
            {isDeactivating && deactivatingRow?.id === row.id 
                ? "Deactivating..." 
                : isAlreadyDeactivated 
                    ? statusField // Show the actual status on the button if inactive/deactivated
                    : "Deactivate"}
        </Button>
    )
  }


  const ticketColumns: TableColumn<DeactivatableTicket>[] = [
    { header: "Ticket No", accessor: "ticketNo", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Ticket Name", accessor: "ticketName" },
    { header: "Quantity", accessor: "quantity" },
    { header: "Purchase Date", accessor: "purchaseDate", cell: (value) => formatDateTime(value), },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    { header: "Action", accessor: "id", cell: (_, row) => renderDeactivateButton(row, "ticket") },
  ]

  const historyColumns: TableColumn<ConsumptionHistory>[] = [
    // Use proper fields from ConsumptionHistory interface
    { header: "Consumption No", accessor: "consumptionNo" }, 
    { header: "Trx No", accessor: "trxNo" },
    { header: "Ticket No", accessor: "ticketNo" },
    { header: "Ticket Item No", accessor: "ticketItemNo" },
    { header: "Ticket Name", accessor: "ticketName" },
    { header: "Terminal ID", accessor: "terminalID" },
    { header: "Ticket Qty", accessor: "ticketQty" },
    { header: "Consumed Qty", accessor: "consumeQty" },
    { header: "Modified Date", accessor: "modifiedDate",cell: (value) => formatDateTime(value), },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    { 
        header: "Action", 
        accessor: "id", 
        cell: (_, row) => renderDeactivateButton(row, "consumption") 
    },
  ]

  return (
    <>
      {/* Search Section */}
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

      {/* Ticket Details */}
      {(ticketDetails.length > 0) || isSearching ? (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <Ticket className="h-5 w-5 text-muted-foreground" />
              Ticket Details ({ticketDetails.length})
            </div>
            <DataTable
              columns={ticketColumns}
              data={ticketDetails}
              keyExtractor={(row) => row.id}
              emptyMessage={isSearching ? "Searching..." : "No ticket found"}
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Consumption History */}
      {(consumptionHistory.length > 0) && (
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold">
              <History className="h-5 w-5 text-muted-foreground" />
              Consumption History ({consumptionHistory.length})
            </div>
            <DataTable
              columns={historyColumns}
              data={consumptionHistory}
              keyExtractor={(row) => row.id}
              emptyMessage={isSearching ? "Searching..." : "No consumption records found"}
            />
          </CardContent>
        </Card>
      )}


      {/* Deactivation Confirmation Dialog */}
      {isConfirmOpen && deactivatingRow && (
        <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deactivation</AlertDialogTitle>
              <AlertDialogDescription>
                {deactivatingType === "ticket"
                  ? `Are you sure you want to deactivate Ticket No: ${deactivatingRow.ticketNo} (ID: ${deactivatingRow.ticketID})? This action will prevent future use of this ticket and may affect associated consumption records.`
                  : `Are you sure you want to deactivate Consumption Entry No: ${deactivatingRow.consumptionNo} (Trx No: ${deactivatingRow.trxNo})? This action cannot be undone.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeactivating}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeactivateConfirm}
                disabled={isDeactivating}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeactivating ? "Deactivating..." : "Deactivate"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}