"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SearchField } from "@/components/shared-components/search-field"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { TransactionHistory, TicketHistory } from "@/type/themepark-support"; 
import { itPoswfService } from "@/services/themepark-support"; 
import { formatCurrency, formatDate } from "@/lib/formatter";
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { usePagination } from "@/hooks/use-pagination"
import { Button } from "@/components/ui/button";
import { Pencil, SearchX, ShoppingBag, Calendar } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile"; 
import { 
    Sheet, 
    SheetContent, 
    SheetHeader, 
    SheetTitle, 
    SheetDescription 
} from "@/components/ui/sheet"; 
import { ScrollArea } from "@/components/ui/scroll-area"; 
import { Separator } from "@/components/ui/separator";

// --- Helpers ---
function parseAmount(amount: string | number): number {
    if (typeof amount === 'number') return amount;
    if (!amount) return 0;
    const cleanStr = amount.replace(/[^0-9.-]+/g, "");
    return parseFloat(cleanStr) || 0;
}

interface GroupedInvoice {
    id: string; 
    invoiceNo: string;
    totalAmount: number;
    trxType: string; 
    createdDate: string;
    items: TransactionHistory[];
}

export default function SearchHistoryRecordTab() {
  const toast = useAppToast();
  const isMobile = useIsMobile();

  // --- State for Mobile Details Sheet ---
  const [selectedInvoice, setSelectedInvoice] = useState<GroupedInvoice | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const [searchType, setSearchType] = useState<"email" | "mobile" | "invoice">("email")
  const [searchTerm, setSearchTerm] = useState("")
  const [rawHistoryData, setRawHistoryData] = useState<TransactionHistory[]>([])
  const [ticketData, setTicketData] = useState<TicketHistory[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Pagination
  const trxPager = usePagination({ pageSize: 10 });
  const ticketPager = usePagination({ pageSize: 10 });

  // Sorting
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  // Core Search Logic
  const executeSearch = useCallback(async (type: string, term: string) => {
    if (!term) return;
    setIsSearching(true);
    setSortConfig(null);
    trxPager.reset();
    ticketPager.reset();
    setRawHistoryData([]);
    setTicketData([]);

    try {
        const response = await itPoswfService.searchHistory(type, term);
        if (response.success && response.data) { 
            setRawHistoryData(response.data.transactionHistory || []); 
            setTicketData(response.data.ticketHistory || []);

            const totalCount = (response.data.transactionHistory?.length || 0) + (response.data.ticketHistory?.length || 0);
            
            if (totalCount === 0) {
                 toast.info("Search Complete", "No records found.");
            } else {
                 toast.info("Search Complete",`Found ${totalCount} records.`);
            }
        } else {
            toast.error("Search Failed",  response.error || "Server error.");
        }
    } catch (error) {
        toast.error("Error",  "Network error.");
    } finally {
        setIsSearching(false);
    }
  }, [toast]);

  // 2. AUTO-DETECT & SEARCH EFFECT
  useAutoSearch((query) => {
      const cleanQuery = query.trim();
      setSearchTerm(cleanQuery);

      let detectedType: "email" | "mobile" | "invoice" = "invoice"; 

      if (cleanQuery.includes("@")) {
          detectedType = "email";
      } 
      else if (/^[+0][0-9\s-]{8,}$/.test(cleanQuery)) {
          detectedType = "mobile";
      }
      
      setSearchType(detectedType);
      executeSearch(detectedType, cleanQuery);
  });

  // 3. MANUAL TRIGGER
  const handleManualSearch = () => {
      executeSearch(searchType, searchTerm);
  }

  
  // --- DATA PROCESSING ---
  const groupedTransactions = useMemo(() => {
      const groups: Record<string, GroupedInvoice> = {};
      (rawHistoryData || []).forEach(item => {
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

  // Sorting Logic
  const sortedTransactions = useMemo(() => {
      const sortableItems = [...groupedTransactions];
      if (sortConfig !== null) {
        sortableItems.sort((a, b) => {
            // @ts-ignore - dynamic access
            const aValue = a[sortConfig.key] ?? "";
            // @ts-ignore
            const bValue = b[sortConfig.key] ?? "";
            
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
      }
      return sortableItems;
  }, [groupedTransactions, sortConfig]);

  // Pagination Logic
  const paginatedTransactions = useMemo(() => {
      const start = (trxPager.currentPage - 1) * trxPager.pageSize;
      return sortedTransactions.slice(start, start + trxPager.pageSize);
  }, [sortedTransactions, trxPager.currentPage, trxPager.pageSize]);

  const paginatedTickets = useMemo(() => {
      const start = (ticketPager.currentPage - 1) * ticketPager.pageSize;
      return ticketData.slice(start, start + ticketPager.pageSize);
  }, [ticketData, ticketPager.currentPage, ticketPager.pageSize]);

  // Handler for DataTable sorting
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Handler for Row Click (Mobile Only)
  const handleRowClick = (row: GroupedInvoice) => {
      setSelectedInvoice(row);
      setIsSheetOpen(true);
  };

  // --- COLUMN DEFINITIONS ---
  const transactionColumns: TableColumn<GroupedInvoice>[] = [
      { header: "Invoice No", accessor: "invoiceNo", sortable: true, className: "w-[300px]", cell: (val, row) => (
          <div className="flex items-center gap-2">
             <span className="font-medium text-blue-600 dark:text-blue-400">{val}</span>
             <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-100 px-1 text-[10px] font-bold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                {row.items.length}
             </span>
          </div>
      )},
      { header: "Total Amount", accessor: "totalAmount", sortable: true, className: "w-[150px] text-right", cell: (val) => formatCurrency(val)},
      { header: "Type", accessor: "trxType", sortable: true, className: "text-center", cell: (val) => <StatusBadge status={val} /> },
      { header: "Created Date", accessor: "createdDate", sortable: true, className: "text-center", cell: (val) => <span className="text-muted-foreground text-sm">{formatDate(val as string)}</span> },
      { header: "Actions", accessor: "id", className: "text-right pr-20", cell: () => (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground hover:text-foreground" onClick={(e) => e.stopPropagation()}>
              <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
      )}
  ];

  const ticketColumns: TableColumn<TicketHistory>[] = [
    { header: "Ticket No", accessor: "ticketNo", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Package Name", accessor: "packageName" },
    { header: "Qty", accessor: "qty" },
    { header: "Start Date", accessor: "startDate" },
    { header: "Expiry Date", accessor: "expiryDate" },
    { header: "Last Valid Date", accessor: "lastValidDate" },
    { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    { header: "Created Date", accessor: "createdDate", cell: (value) => <span className="text-muted-foreground text-sm w-[180px]">{formatDate(value as string)}</span> },
  ];

  // --- SUB-COMPONENT RENDERER  (DESKTOP)---
  const renderDetailRow = (group: GroupedInvoice) => {
      return (
        <div className="py-2 pl-4 ml-8 border-l-2 border-gray-200 bg-gray-50/50 dark:bg-gray-900/10 rounded-r-md my-2">
            <div className="flex items-center px-2 py-2 border-b border-border/30 mb-1">
                <div className="w-[60px] text-[10px] font-semibold text-muted-foreground uppercase">Trx ID</div>
                <div className="flex-1 text-[10px] font-semibold text-muted-foreground uppercase">Attraction Name</div>
                <div className="w-[120px] text-right text-[10px] font-semibold text-muted-foreground uppercase pr-4">Amount</div>
            </div>
            <div className="flex flex-col">
                {group.items.map((item, index) => (
                    <div key={`${item.trxID}-${index}`} className="flex items-center px-2 py-2 border-t border-border/30 first:border-0 hover:bg-white/40 dark:hover:bg-black/20 transition-colors">
                        <div className="w-[60px] text-xs font-mono text-gray-600">{item.trxID}</div>
                        <div className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200 truncate pr-4">{item.attractionName}</div>
                        <div className="w-[120px] text-sm text-right text-gray-900 dark:text-gray-100 font-medium pr-4">RM {parseAmount(item.amount).toFixed(2)}</div>
                    </div>
                ))}
            </div>
        </div>
      );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="searchType" className="text-sm font-medium">Search By</Label>
              <Select value={searchType} onValueChange={(value: any) => setSearchType(value)}>
                <SelectTrigger id="searchType" className="h-10">
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
              label="Search"
              placeholder="Enter Email, Mobile No, or Invoice No"
              value={searchTerm}
              onChange={setSearchTerm}
              onSearch={handleManualSearch}
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
                <DataTable 
                    columns={transactionColumns}
                    data={paginatedTransactions}
                    keyExtractor={(row) => row.id}
                    isLoading={isSearching}
                    emptyTitle="No Transactions Found"
                    emptyIcon={SearchX}
                    emptyMessage={searchTerm ? "No records found matching your search." : "Enter a search term to begin."}
                    renderSubComponent={isMobile ? undefined : renderDetailRow}
                    onRowClick={isMobile ? handleRowClick : undefined}
                    onSort={handleSort}
                    sortConfig={sortConfig}
                    pagination={{
                        currentPage: trxPager.currentPage,
                        totalPages: Math.ceil(sortedTransactions.length / trxPager.pageSize),
                        onPageChange: trxPager.setCurrentPage,
                        pageSize: trxPager.pageSize
                    }}
                />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ticket" className="mt-0">
          <Card className="rounded-tl-none">
            <CardContent className="p-0">
              <DataTable
                columns={ticketColumns}
                data={paginatedTickets}
                keyExtractor={(row, index) => (row.ticketNo || `tk-${index}`).toString()}
                isLoading={isSearching}
                emptyTitle="No Tickets Found"
                emptyIcon={SearchX}
                emptyMessage={searchTerm ? "No ticket records found." : "Enter a search term to begin."}
                pagination={{
                    currentPage: ticketPager.currentPage,
                    totalPages: Math.ceil(ticketData.length / ticketPager.pageSize),
                    onPageChange: ticketPager.setCurrentPage,
                    pageSize: ticketPager.pageSize
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* --- MOBILE DETAILS SHEET --- */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col h-full">
            {selectedInvoice && (
                <>
                    <SheetHeader className="p-6 border-b bg-muted/10">
                        <SheetTitle className="flex items-center gap-2">
                            <ShoppingBag className="h-5 w-5 text-indigo-600" />
                            Transaction Details
                        </SheetTitle>
                        <SheetDescription>
                            Reviewing items for Invoice <span className="font-mono text-foreground font-medium">{selectedInvoice.invoiceNo}</span>
                        </SheetDescription>
                        
                        <div className="flex items-center gap-4 mt-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3.5 w-3.5" />
                                {formatDate(selectedInvoice.createdDate)}
                            </div>
                            <StatusBadge status={selectedInvoice.trxType} className="h-5 px-2 text-[10px]" />
                        </div>
                    </SheetHeader>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                Items ({selectedInvoice.items.length})
                            </h4>
                            
                            <div className="space-y-3">
                                {selectedInvoice.items.map((item, idx) => (
                                    <div key={idx} className="p-3 rounded-lg border bg-card shadow-sm flex flex-col gap-2">
                                        <div className="flex justify-between items-start gap-2">
                                            <span className="text-sm font-medium leading-tight">{item.attractionName}</span>
                                            <span className="text-sm font-bold whitespace-nowrap">RM {parseAmount(item.amount).toFixed(2)}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <span className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">TRX: {item.trxID}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>

                    <div className="p-6 border-t bg-muted/10">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                            <span className="text-2xl font-bold text-primary">{formatCurrency(selectedInvoice.totalAmount)}</span>
                        </div>
                        <Button className="w-full" onClick={() => setIsSheetOpen(false)}>Close Details</Button>
                    </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </div>
  )
}