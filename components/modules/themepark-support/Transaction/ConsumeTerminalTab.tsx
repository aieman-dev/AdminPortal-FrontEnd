"use client"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { TerminalSelector } from "@/components/shared-components/terminal-selector"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAppToast } from "@/hooks/use-app-toast"
import { itPoswfService } from "@/services/themepark-support"
import { type TerminalTransaction } from "@/type/themepark-support"
import { formatDateTime } from "@/lib/formatter";
import { PaginationControls } from "@/components/ui/pagination-controls"
import { usePagination } from "@/hooks/use-pagination"


export default function ConsumeTerminalTab() {
    const toast = useAppToast();
    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")
    const [searchDate, setSearchDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [purchaseHistory, setPurchaseHistory] = useState<TerminalTransaction[]>([])
    const [consumeHistory, setConsumeHistory] = useState<TerminalTransaction[]>([])
    const [isHistorySearching, setIsHistorySearching] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    
    // Pagination States
    const purchasePager = usePagination({ pageSize: 10 });
    const consumePager = usePagination({ pageSize: 10 });

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            setSearchDate(localDate.toISOString().split('T')[0]);
        } else {
            setSearchDate("");
        }
    };

    const handleHistorySearch = async (query?: string) => {
        const termId = query || selectedTerminalId;

        if (!termId) {
            if(!query) toast.info("Input Required", "Please select a valid Terminal ID.");
            return;
        }

        if(query) setSelectedTerminalId(query);

        setIsHistorySearching(true);
        setHasSearched(true);
        setPurchaseHistory([]);
        setConsumeHistory([]);
        purchasePager.reset();
        consumePager.reset();

        try {
            const response = await itPoswfService.searchTerminalHistory(selectedTerminalId, searchDate);

            if (response.success && response.data) {
                setPurchaseHistory(response.data.purchaseHistory);
                setConsumeHistory(response.data.consumeHistory);
                
                const hasData = response.data.purchaseHistory.length > 0 || response.data.consumeHistory.length > 0;
                if (!hasData) {
                      toast.info("Search Complete", `No history found for this terminal on ${searchDate}.` );
                } else {
                      toast.info("Search Complete", "History data retrieved." );
                }
            } else {
                toast.error( "Search Failed", response.error || "Could not retrieve history.");
            }
        } catch (error) {
            console.error("History Search Error:", error);
            toast.error("Network Error", "Failed to connect.");
        } finally {
            setIsHistorySearching(false);
        }
    }

    // Updated Slicing Logic using Hook State
    const paginatedPurchase = useMemo(() => {
        const start = (purchasePager.currentPage - 1) * purchasePager.pageSize;
        return purchaseHistory.slice(start, start + purchasePager.pageSize);
    }, [purchaseHistory, purchasePager.currentPage, purchasePager.pageSize]);

    const paginatedConsume = useMemo(() => {
        const start = (consumePager.currentPage - 1) * consumePager.pageSize;
        return consumeHistory.slice(start, start + consumePager.pageSize);
    }, [consumeHistory, consumePager.currentPage, consumePager.pageSize]);

    const commonColumns: TableColumn<TerminalTransaction>[] = [
        { header: "Transaction ID", accessor: "trxID",className: "pl-6", cell: (value) => <span className="font-medium">{value}</span> },
        { header: "Invoice No", accessor: "invoiceNo" },
        { header: "Transaction Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> },
        { header: "Amount", accessor: "amount", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
        { header: "Created Date", accessor: "createdDate", cell: (value) => formatDateTime(value) },
        { header: "Status", accessor: "recordStatus", cell: (value) => <StatusBadge status={value} /> },
        { header: "Created By", accessor: "createdBy" },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-4 items-end">
                        <div className="w-full lg:flex-1 space-y-2">
                            <TerminalSelector 
                                value={selectedTerminalId}
                                onChange={setSelectedTerminalId}
                                label="Select Terminal"
                                placeholder="Search terminal name or ID"
                                className="h-11"
                            />
                        </div>
                        <div className="w-full lg:w-[180px] space-y-2">
                            <Label htmlFor="search-date" className="text-sm font-medium">Search Date</Label>
                            <DatePicker
                                date={searchDate ? new Date(searchDate) : undefined}
                                setDate={handleDateSelect}
                                className="h-11"
                            />
                        </div>
                        <div className="w-full lg:w-auto space-y-2">
                            <Button onClick={() => handleHistorySearch()}
                                    disabled={isHistorySearching || !selectedTerminalId}
                                    className="h-11 px-8 w-full lg:w-auto">
                                <Search className="mr-2 h-4 w-4" />
                                {isHistorySearching ? "Searching..." : "Search History"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {hasSearched && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <Tabs defaultValue="purchase" className="w-full">
                        <TabsList className="inline-flex bg-transparent p-0 h-auto gap-0 rounded-none border-0 mb-0">
                            <TabsTrigger value="purchase" className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border data-[state=active]:border-b-transparent data-[state=active]:bg-card -mb-px">
                                Purchase History ({purchaseHistory.length})
                            </TabsTrigger>
                            <TabsTrigger value="consume" className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border data-[state=active]:border-b-transparent data-[state=active]:bg-card -mb-px -ml-px">
                                Consume History ({consumeHistory.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="purchase" className="mt-0">
                            <Card className="rounded-tl-none">
                                <CardContent className="p-0">
                                    <DataTable
                                        columns={commonColumns}
                                        data={paginatedPurchase}
                                        keyExtractor={(row) => row.id} 
                                        emptyMessage={isHistorySearching ? "Loading..." : "No purchase records found."}
                                        isLoading={isHistorySearching}
                                    />
                                    <div className="p-6 border-t bg-muted/5">
                                        <PaginationControls
                                            currentPage={purchasePager.currentPage}
                                            totalPages={Math.ceil(purchaseHistory.length / purchasePager.pageSize)}
                                            totalRecords={purchaseHistory.length}
                                            pageSize={purchasePager.pageSize}
                                            onPageChange={purchasePager.setCurrentPage}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="consume" className="mt-0">
                            <Card className="rounded-tl-none">
                                <CardContent className="p-0">
                                    <DataTable
                                        columns={commonColumns}
                                        data={paginatedConsume}
                                        keyExtractor={(row) => row.id}
                                        emptyMessage={isHistorySearching ? "Loading..." : "No consumption records found."}
                                        isLoading={isHistorySearching}
                                    />
                                    <div className="p-6 border-t bg-muted/5">
                                        <PaginationControls
                                            currentPage={consumePager.currentPage}
                                            totalPages={Math.ceil(consumeHistory.length / consumePager.pageSize)}
                                            totalRecords={consumeHistory.length}
                                            pageSize={consumePager.pageSize}
                                            onPageChange={consumePager.setCurrentPage}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
}