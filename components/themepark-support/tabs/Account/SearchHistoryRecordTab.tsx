// components/it-poswf/tabs/Account/SearchHistoryRecordTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { TransactionHistory, TicketHistory } from "@/type/themepark-support"; 
import { itPoswfService } from "@/services/themepark-support"; 
import { useToast } from "@/hooks/use-toast";

function formatHistoryDate(dateString: string): string {
    if (!dateString) return "—";
    
    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return dateString;
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export default function SearchHistoryRecordTab() {
  const [searchType, setSearchType] = useState<"email" | "mobile" | "invoice">("email")
  const [searchTerm, setSearchTerm] = useState("")
  const [historyData, setHistoryData] = useState<TransactionHistory[]>([])
  const [ticketData, setTicketData] = useState<TicketHistory[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm) {
        setHistoryData([]);
        setTicketData([]);
        toast({
            title: "Search Required",
            description: "Please enter a search term.",
            variant: "default",
        });
        return;
    }
    
    setIsSearching(true);
    
    try {
        const response = await itPoswfService.searchHistory(searchType, searchTerm);

        if (response.success && response.data) { 
            setHistoryData(response.data.transactionHistory); 
            setTicketData(response.data.ticketHistory);

            if (response.data.transactionHistory.length === 0 && response.data.ticketHistory.length === 0) {
                 toast({
                    title: "Search Complete",
                    description: "No transaction records found for the given value.",
                    variant: "default",
                });
            }

        } else {
            console.error("API Error:", response.error);
            setHistoryData([]);
            setTicketData([]);
            toast({
                title: "Search Failed",
                description: response.error || "Server error occurred.",
                variant: "destructive",
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

  const historyColumns: TableColumn<TransactionHistory >[] = [
    {
      header: "Transaction ID",
      accessor: "trxID",
      cell: (value) => <span className="font-mono text-sm">{value}</span>,
    },
    { header: "Invoice No", accessor: "invoiceNo" },
    { header: "Attraction", accessor: "attractionName" }, 
    { header: "Amount", accessor: "amount" },
    { header: "Transaction Type", accessor: "trxType", 
      cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate", 
      cell: (value) => <span className="font-mono text-sm">{formatHistoryDate(value as string)}</span>},
  ]

  const ticketColumns: TableColumn<TicketHistory>[] = [
    {
      header: "Ticket No",
      accessor: "ticketNo",
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    { header: "Package Name", accessor: "packageName" },
    { header: "Package ID", accessor: "packageID" },
    { header: "Qty", accessor: "qty" },
    { header: "Start Date", accessor: "startDate" },
    { header: "Expiry Date", accessor: "expiryDate" },
    { header: "Last Valid Date", accessor: "lastValidDate" },
    { header: "Valid Days", accessor: "validDays" },
    { header: "Status", accessor: "status",
       cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate" ,
      cell: (value) => <span className="font-mono text-sm">{formatHistoryDate(value as string)}</span>
    },
  ]

  return (
    <div className="space-y-6">
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
                keyExtractor={(row, index) => 
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