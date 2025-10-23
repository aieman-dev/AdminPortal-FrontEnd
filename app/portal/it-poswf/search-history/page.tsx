"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchField } from "@/components/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/it-poswf/data-table"
import { StatusBadge } from "@/components/it-poswf/status-badge"
import { mockHistoryData, mockTicketHistory, type HistoryRecord, type TicketHistory } from "@/lib/mock-data/it-poswf"

export default function SearchHistoryPage() {
  const [searchType, setSearchType] = useState<"email" | "mobile" | "invoice">("email")
  const [searchTerm, setSearchTerm] = useState("")
  const [historyData, setHistoryData] = useState(mockHistoryData)
  const [ticketData, setTicketData] = useState(mockTicketHistory)
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    setIsSearching(true)
    setTimeout(() => {
      if (searchTerm) {
        const filtered = mockHistoryData.filter((record) => {
          const term = searchTerm.toLowerCase()
          switch (searchType) {
            case "email":
              return record.email.toLowerCase().includes(term)
            case "mobile":
              return record.mobile.toLowerCase().includes(term)
            case "invoice":
              return record.invoiceNo.toLowerCase().includes(term)
            default:
              return false
          }
        })
        setHistoryData(filtered)

        const filteredTickets = mockTicketHistory.filter((ticket) => {
          const term = searchTerm.toLowerCase()
          switch (searchType) {
            case "email":
              return ticket.transactionId.toLowerCase().includes(term)
            case "mobile":
              return ticket.ticketNo.toLowerCase().includes(term)
            case "invoice":
              return ticket.transactionId.toLowerCase().includes(term)
            default:
              return false
          }
        })
        setTicketData(filteredTickets)
      } else {
        setHistoryData(mockHistoryData)
        setTicketData(mockTicketHistory)
      }
      setIsSearching(false)
    }, 500)
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
    { header: "Attraction", accessor: "attraction" },
    { header: "Amount", accessor: "amount" },
    { header: "Transaction Type", accessor: "transactionType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate" },
  ]

  const ticketColumns: TableColumn<TicketHistory>[] = [
    {
      header: "Transaction ID",
      accessor: "transactionId",
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    { header: "Package Name", accessor: "packageName" },
    { header: "Package ID", accessor: "packageId" },
    { header: "Qty", accessor: "qty" },
    { header: "Start Date", accessor: "startDate" },
    { header: "Expiry Date", accessor: "expiryDate" },
    { header: "Last Valid Date", accessor: "lastValidDate" },
    { header: "Valid Days", accessor: "validDays" },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    { header: "Ticket No", accessor: "ticketNo" },
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
            Transaction History
          </TabsTrigger>
          <TabsTrigger
            value="ticket"
            className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border -ml-px data-[state=active]:border-b-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:relative data-[state=active]:z-10 data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b-border"
          >
            Ticket History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transaction" className="mt-0">
          <Card className="rounded-tl-none">
            <CardContent>
              <DataTable
                columns={historyColumns}
                data={historyData}
                keyExtractor={(row) => row.id}
                emptyMessage="No records found"
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
                keyExtractor={(row) => row.id}
                emptyMessage="No ticket records found"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
