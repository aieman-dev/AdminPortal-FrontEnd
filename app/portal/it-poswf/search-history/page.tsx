// app/portal/it-poswf/search-history/page.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchField } from "@/components/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/it-poswf/data-table"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { HistoryRecord, TicketHistory } from "@/type/it-poswf"; 
import { itPoswfService } from "@/services/it-poswf-services"; 
import { useToast } from "@/hooks/use-toast";


export default function SearchHistoryPage() {
  const [searchType, setSearchType] = useState<"email" | "mobile" | "invoice">("email")
  const [searchTerm, setSearchTerm] = useState("")
  // Initialize with empty arrays instead of mock data
  const [historyData, setHistoryData] = useState<HistoryRecord[]>([])
  const [ticketData, setTicketData] = useState<TicketHistory[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { toast } = useToast();

  // --- UPDATED handleSearch function to rely on response.success ---
  const handleSearch = async () => {
    if (!searchTerm) {
        setHistoryData([]);
        setTicketData([]);
        toast({
            title: "Search Required",
            description: "Please enter a search term.",
            variant: "default", // Use default style for input validation
        });
        return;
    }
    
    setIsSearching(true);
    
    try {
        const response = await itPoswfService.searchHistory(searchType, searchTerm);

        // CHECK 1: If the overall API call (HTTP status) succeeded and data structure is present.
        if (response.success && response.data) { 
            // SUCCESS PATH (200 OK): Data received, even if the arrays are empty.
            
            // Set the state with the received (potentially empty) arrays
            setHistoryData(response.data.transactionHistory); 
            setTicketData(response.data.ticketHistory);

            // Optional: Log a status message for clarity (not an error)
            if (response.data.transactionHistory.length === 0 && response.data.ticketHistory.length === 0) {
                 toast({
                    title: "Search Complete",
                    description: "No transaction records found for the given value.",
                    variant: "default",
                });
            }

        } else {
            // ERROR PATH: Only reached if the API Client detected a genuine network error or non-200 status (e.g., 401, 500).
            // We now safely use the message returned by the service/backend.
            console.error("API Error:", response.error);
            setHistoryData([]);
            setTicketData([]);
            toast({
                title: "Search Failed",
                description: response.error || "Server error occurred.",
                variant: "destructive", // Use destructive variant for backend errors
            });
        }
    } catch (error) {
        console.error("Network Error:", error);
        toast({
            title: "Error",
            description: "A network error occurred during the search.",
            variant: "destructive",
        });
    } finally {
        setIsSearching(false);
    }
  }

  const getPlaceholder = () => {
    switch (searchType) {
      case "email":
        return "Enter superapp email"
      case "mobile":
        return "Enter mobile number"
      case "invoice":
        return "Enter QR receipt invoice number"
      default:
        return "Enter search term"
    }
  }

  const historyColumns: TableColumn<HistoryRecord>[] = [
    {
      header: "Transaction ID",
      accessor: "transactionId",
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    { header: "Invoice No", accessor: "invoiceNo" },
    // Corrected accessor field name to match API payload
    { header: "Attraction", accessor: "attractionName" }, 
    { header: "Amount", accessor: "amount" },
    // Corrected accessor field name to match API payload
    { header: "Transaction Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate" },
  ]

  const ticketColumns: TableColumn<TicketHistory>[] = [
    // Use ticketNo as primary key, as it appears unique in the API payload
    {
      header: "Ticket No",
      accessor: "ticketNo",
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    { header: "Package Name", accessor: "packageName" },
    // Corrected accessor field name
    { header: "Package ID", accessor: "packageID" },
    { header: "Qty", accessor: "qty" },
    { header: "Start Date", accessor: "startDate" },
    { header: "Expiry Date", accessor: "expiryDate" },
    { header: "Last Valid Date", accessor: "lastValidDate" },
    { header: "Valid Days", accessor: "validDays" },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate" },
  ]

  return (
    <div className="space-y-6">
      {/* Search Section */}
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchType" className="text-sm font-medium">
                Search By
              </Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger id="searchType" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Superapp Email</SelectItem>
                  <SelectItem value="mobile">Mobile No</SelectItem>
                  <SelectItem value="invoice">QR Receipt Invoice No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <SearchField
              label="Search Term"
              placeholder={getPlaceholder()}
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleSearch}
              isSearching={isSearching}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transaction" className="w-full">
        <TabsList className="inline-flex bg-transparent p-0 h-auto gap-0 rounded-none border-0 mb-0">
          <TabsTrigger
            value="transaction"
            className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border data-[state=active]:border-b-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:relative data-[state=active]:z-10 data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b-border"
          >
            Transaction History ({historyData.length})
          </TabsTrigger>
          <TabsTrigger
            value="ticket"
            className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border -ml-px data-[state=active]:border-b-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:relative data-[state=active]:z-10 data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b-border"
          >
            Ticket History ({ticketData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transaction" className="mt-0">
          <Card className="rounded-tl-none">
            <CardContent>
              <DataTable
                columns={historyColumns}
                data={historyData}
                // FINAL FIX: Use a composite key (InvoiceNo + Index) to guarantee uniqueness for React.
                keyExtractor={(row, index) => 
                    // Fallback to a placeholder if invoiceNo is falsy, then append index
                    (row.invoiceNo || `no-invoice-${index}`) + `-${index}`
                } 
                emptyMessage={isSearching ? "Searching..." : "No transaction records found"}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticket" className="mt-0">
          <Card className="rounded-tl-none">
            <CardContent>
              <DataTable
                columns={ticketColumns}
                data={ticketData}
                // Ticket History should use ticketNo (which is unique per ticket), 
                // combined with index for safety/empty fields.
                keyExtractor={(row, index) => (row.ticketNo || `tk-${index}`).toString()}
                emptyMessage={isSearching ? "Searching..." : "No ticket records found"}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}