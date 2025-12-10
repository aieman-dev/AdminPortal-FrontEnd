"use client"

import React, { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
// 1. Import your existing component
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { TransactionHistory, TicketHistory } from "@/type/themepark-support"; 
import { itPoswfService } from "@/services/themepark-support"; 
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; 
import { ChevronDown, ChevronRight, ArrowUpDown, Pencil, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

// --- Helper Functions ---

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-GB', { 
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true 
  }).format(date);
};

// Removed 'getTypeStyles' since we are using StatusBadge now

function parseAmount(amount: string | number): number {
    if (typeof amount === 'number') return amount;
    if (!amount) return 0;
    const cleanStr = amount.replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanStr) || 0;
}

// --- Interfaces ---

interface GroupedInvoice {
    id: string; 
    invoiceNo: string;
    totalAmount: number;
    trxType: string; 
    createdDate: string;
    items: TransactionHistory[];
}

export default function SearchHistoryRecordTab() {
  const [searchType, setSearchType] = useState<"email" | "mobile" | "invoice">("email")
  const [searchTerm, setSearchTerm] = useState("")
  const [rawHistoryData, setRawHistoryData] = useState<TransactionHistory[]>([])
  const [ticketData, setTicketData] = useState<TicketHistory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [sortConfig, setSortConfig] = useState<{ key: keyof GroupedInvoice | string, direction: 'asc' | 'desc' } | null>(null);

  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm) {
        setRawHistoryData([]);
        setTicketData([]);
        toast({ title: "Search Required", description: "Please enter a search term." });
        return;
    }
    setIsSearching(true);
    setSortConfig(null);
    setExpandedRows(new Set());
    
    try {
        const response = await itPoswfService.searchHistory(searchType, searchTerm);
        if (response.success && response.data) { 
            setRawHistoryData(response.data.transactionHistory); 
            setTicketData(response.data.ticketHistory);
            if (response.data.transactionHistory.length === 0 && response.data.ticketHistory.length === 0) {
                 toast({ title: "Search Complete", description: "No records found." });
            }
        } else {
            toast({ title: "Search Failed", description: response.error || "Server error.", variant: "destructive" });
        }
    } catch (error) {
        toast({ title: "Error", description: "Network error.", variant: "destructive" });
    } finally {
        setIsSearching(false);
    }
  }

  const groupedTransactions = useMemo(() => {
      const groups: Record<string, GroupedInvoice> = {};

      rawHistoryData.forEach(item => {
          const key = item.invoiceNo || `TRX-${item.trxID}`;
          
          if (!groups[key]) {
              groups[key] = {
                  id: key, 
                  invoiceNo: item.invoiceNo || 'N/A',
                  totalAmount: 0,
                  trxType: item.trxType, 
                  createdDate: item.createdDate,
                  items: []
              };
          }
          
          groups[key].totalAmount += parseAmount(item.amount);
          groups[key].items.push(item);
      });

      return Object.values(groups);
  }, [rawHistoryData]);

  const sortedTransactions = useMemo(() => {
      const sortableItems = [...groupedTransactions];
      if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            const aValue = a[sortConfig.key as keyof GroupedInvoice] ?? "";
            const bValue = b[sortConfig.key as keyof GroupedInvoice] ?? "";
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
      }
      return sortableItems;
  }, [groupedTransactions, sortConfig]);

  const requestSort = (key: keyof GroupedInvoice) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleRowExpand = (id: string) => {
      const newSet = new Set(expandedRows);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setExpandedRows(newSet);
  };

  const getPlaceholder = () => {
    switch (searchType) {
      case "email": return "Enter superapp email"
      case "mobile": return "Enter mobile number"
      case "invoice": return "Enter QR receipt invoice number"
      default: return "Enter search term"
    }
  }

  const ticketColumns: TableColumn<TicketHistory>[] = [
    { header: "Ticket No", accessor: "ticketNo", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Package Name", accessor: "packageName" },
    { header: "Package ID", accessor: "packageID" },
    { header: "Qty", accessor: "qty" },
    { header: "Start Date", accessor: "startDate" },
    { header: "Expiry Date", accessor: "expiryDate" },
    { header: "Last Valid Date", accessor: "lastValidDate" },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate", cell: (value) => <span className="font-mono text-sm">{formatDate(value as string)}</span> },
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="searchType" className="text-sm font-medium">Search By</Label>
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
          <TabsTrigger value="transaction" className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border data-[state=active]:border-b-transparent">
            Transaction History ({rawHistoryData.length})
          </TabsTrigger>
          <TabsTrigger value="ticket" className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border -ml-px data-[state=active]:border-b-transparent">
            Ticket History ({ticketData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transaction" className="mt-0">
          <Card className="rounded-tl-none">
            <CardContent className="p-0">
              <div className="rounded-md border border-border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead style={{ width: "30%" }} className="cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => requestSort('invoiceNo')}>
                          <div className="flex items-center gap-1">Invoice No <ArrowUpDown className="h-3 w-3" /></div>
                      </TableHead>
                      <TableHead style={{ width: "15%" }} className="text-right cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => requestSort('totalAmount')}>
                          <div className="flex items-center justify-end gap-1">Total Amount <ArrowUpDown className="h-3 w-3" /></div>
                      </TableHead>
                      <TableHead style={{ width: "15%" }} className="text-center cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => requestSort('trxType')}>
                          <div className="flex items-center justify-center gap-1">Type <ArrowUpDown className="h-3 w-3" /></div>
                      </TableHead>
                      <TableHead style={{ width: "25%" }} className="text-center cursor-pointer hover:bg-muted/80 transition-colors" onClick={() => requestSort('createdDate')}>
                          <div className="flex items-center justify-center gap-1">Created Date <ArrowUpDown className="h-3 w-3" /></div>
                      </TableHead>
                      <TableHead className="text-right pr-8">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isSearching ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Searching...</TableCell></TableRow>
                    ) : sortedTransactions.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No records found.</TableCell></TableRow>
                    ) : (
                        sortedTransactions.map((group) => {
                            const isExpanded = expandedRows.has(group.id);
                            const uniqueTypes = Array.from(new Set(group.items.map(i => i.trxType)));
                            // Calculate group type for the badge
                            const groupType = uniqueTypes.length > 1 ? 'Mixed' : uniqueTypes[0];

                            return (
                                <React.Fragment key={group.id}>
                                    <TableRow 
                                        className={cn("cursor-pointer hover:bg-muted/30 transition-colors", isExpanded && "bg-muted/30")}
                                        onClick={() => toggleRowExpand(group.id)}
                                    >
                                        <TableCell>
                                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                        </TableCell>
                                        
                                        <TableCell className="font-medium text-indigo-600 dark:text-indigo-400">
                                            {group.invoiceNo}
                                            <span className="ml-2 text-[10px] text-muted-foreground font-normal">({group.items.length} items)</span>
                                        </TableCell>

                                        <TableCell className="text-right font-bold text-gray-900">
                                            RM {group.totalAmount.toFixed(2)}
                                        </TableCell>

                                        {/* 2. REPLACED: Use StatusBadge here */}
                                        <TableCell className="text-center">
                                            <StatusBadge status={groupType || 'N/A'} />
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="font-normal text-xs text-gray-600 bg-gray-100 border-gray-200 gap-1.5 py-1 px-2.5 w-[170px] justify-center mx-auto">
                                                <Clock className="w-3.5 h-3.5 opacity-70" />
                                                {formatDate(group.createdDate)}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="text-right pr-8">
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                                                onClick={(e) => {
                                                    e.stopPropagation(); 
                                                    toast({ title: "Edit Action", description: `Feature pending for ${group.invoiceNo}` });
                                                }}
                                            >
                                                <Pencil className="h-3.5 w-3.5" /> Edit
                                            </Button>
                                        </TableCell>
                                    </TableRow>

                                    {/* Expanded Sub-Table */}
                                    {isExpanded && (
                                        <TableRow className="bg-muted/10 hover:bg-muted/10 border-t-0">
                                            <TableCell colSpan={6} className="p-0">
                                                <div className="p-4 pl-4 bg-muted/20 border-b shadow-inner">
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow className="border-b border-border/50 hover:bg-transparent">
                                                                <TableHead className="w-[40px] h-8 text-xs font-semibold">#</TableHead>
                                                                <TableHead className="w-[80px] h-8 text-xs font-semibold">Trx ID</TableHead>
                                                                <TableHead className="h-8 text-xs font-semibold" style={{ width: "calc(30% - 86px)" }}>Attraction Name</TableHead>
                                                                <TableHead className="h-8 text-xs font-semibold text-right" style={{ width: "15%" }}>Amount</TableHead>
                                                                <TableHead className="h-8" style={{ width: "auto" }}></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {group.items.map((item, index) => (
                                                                <TableRow key={`${item.trxID}-${index}`} className="border-none hover:bg-transparent">
                                                                    <TableCell className="py-2 text-xs text-muted-foreground">{index + 1}</TableCell>
                                                                    <TableCell className="py-2 text-xs font-mono text-gray-600">{item.trxID}</TableCell>
                                                                    <TableCell className="py-2 text-sm font-medium text-gray-800 break-words">
                                                                        {item.attractionName}
                                                                    </TableCell>
                                                                    <TableCell className="py-2 text-sm text-right text-gray-900 font-bold">
                                                                        RM {parseAmount(item.amount).toFixed(2)}
                                                                    </TableCell>
                                                                    <TableCell></TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </React.Fragment>
                            );
                        })
                    )}
                  </TableBody>
                </Table>
              </div>
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