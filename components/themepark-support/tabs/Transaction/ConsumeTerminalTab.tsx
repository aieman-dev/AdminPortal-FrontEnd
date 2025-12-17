"use client"
import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { TerminalSelector } from "@/components/themepark-support/it-poswf/terminal-selector"
import { DatePicker } from "@/components/ui/date-picker"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { itPoswfService } from "@/services/themepark-support"
import { type TerminalTransaction } from "@/type/themepark-support"
import { PaginationControls } from "@/components/ui/pagination-controls"

function formatHistoryDate(dateString: string): string {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).replace(',', '');
}

export default function ConsumeTerminalTab() {
    const { toast } = useToast();
    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")
    const [searchDate, setSearchDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [purchaseHistory, setPurchaseHistory] = useState<TerminalTransaction[]>([])
    const [consumeHistory, setConsumeHistory] = useState<TerminalTransaction[]>([])
    const [isHistorySearching, setIsHistorySearching] = useState(false)
    
    // Pagination States
    const [currentPagePurchase, setCurrentPagePurchase] = useState(1);
    const [currentPageConsume, setCurrentPageConsume] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const handleDateSelect = (date: Date | undefined) => {
        if (date) {
            const offset = date.getTimezoneOffset();
            const localDate = new Date(date.getTime() - (offset * 60 * 1000));
            setSearchDate(localDate.toISOString().split('T')[0]);
        } else {
            setSearchDate("");
        }
    };

    const handleHistorySearch = async () => {
        if (!selectedTerminalId) {
            toast({ title: "Input Required", description: "Please select a valid Terminal ID.", variant: "default" });
            return;
        }

        setIsHistorySearching(true);
        setPurchaseHistory([]);
        setConsumeHistory([]);
        setCurrentPagePurchase(1);
        setCurrentPageConsume(1);

        try {
            const response = await itPoswfService.searchTerminalHistory(selectedTerminalId, searchDate);

            if (response.success && response.data) {
                setPurchaseHistory(response.data.purchaseHistory);
                setConsumeHistory(response.data.consumeHistory);
                
                const hasData = response.data.purchaseHistory.length > 0 || response.data.consumeHistory.length > 0;
                if (!hasData) {
                      toast({ title: "Search Complete", description: `No history found for this terminal on ${searchDate}.` });
                } else {
                      toast({ title: "Search Complete", description: "History data retrieved." });
                }
            } else {
                toast({ title: "Search Failed", description: response.error || "Could not retrieve history.", variant: "destructive" });
            }
        } catch (error) {
            console.error("History Search Error:", error);
            toast({ title: "Network Error", description: "Failed to connect.", variant: "destructive" });
        } finally {
            setIsHistorySearching(false);
        }
    }

    // --- Pagination Logic ---
    const paginatedPurchase = useMemo(() => {
        const start = (currentPagePurchase - 1) * ITEMS_PER_PAGE;
        return purchaseHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [purchaseHistory, currentPagePurchase]);

    const paginatedConsume = useMemo(() => {
        const start = (currentPageConsume - 1) * ITEMS_PER_PAGE;
        return consumeHistory.slice(start, start + ITEMS_PER_PAGE);
    }, [consumeHistory, currentPageConsume]);

    const commonColumns: TableColumn<TerminalTransaction>[] = [
        { header: "Trx ID", accessor: "trxID", cell: (value) => <span className="font-medium">{value}</span> },
        { header: "Invoice No", accessor: "invoiceNo" },
        { header: "Trx Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> },
        { header: "Amount", accessor: "amount", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
        { header: "Created Date", accessor: "createdDate", cell: (value) => formatHistoryDate(value) },
        { header: "Status", accessor: "recordStatus", cell: (value) => <StatusBadge status={value} /> },
        { header: "Created By", accessor: "createdBy" },
    ];

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <div className="flex flex-col lg:flex-row gap-4 items-end pt-6">
                        <div className="w-full lg:flex-1 space-y-2">
                            <TerminalSelector 
                                value={selectedTerminalId}
                                onChange={setSelectedTerminalId}
                                label="Select Terminal"
                                placeholder="Search terminal name or ID..."
                            />
                        </div>
                        <div className="w-full lg:w-[180px] space-y-2">
                            <Label htmlFor="search-date" className="text-sm font-medium">Search Date</Label>
                            <DatePicker
                                date={searchDate ? new Date(searchDate) : undefined}
                                setDate={handleDateSelect}
                                className="h-9"
                            />
                        </div>
                        <div className="w-full lg:w-auto space-y-2">
                            <Button onClick={handleHistorySearch} 
                                    disabled={isHistorySearching || !selectedTerminalId}
                                    className="h-9 px-8 w-full lg:w-auto">
                                <Search className="mr-2 h-4 w-4" />
                                {isHistorySearching ? "Searching..." : "Search History"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
                        <CardContent className="space-y-4 pt-6">
                            <DataTable
                                columns={commonColumns}
                                data={paginatedPurchase}
                                keyExtractor={(row) => row.id} 
                                emptyMessage={isHistorySearching ? "Loading..." : "No purchase records found."}
                                isLoading={isHistorySearching}
                            />
                            <PaginationControls
                                currentPage={currentPagePurchase}
                                totalPages={Math.ceil(purchaseHistory.length / ITEMS_PER_PAGE)}
                                totalRecords={purchaseHistory.length}
                                pageSize={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPagePurchase}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="consume" className="mt-0">
                    <Card className="rounded-tl-none">
                        <CardContent className="space-y-4 pt-6">
                            <DataTable
                                columns={commonColumns}
                                data={paginatedConsume}
                                keyExtractor={(row) => row.id}
                                emptyMessage={isHistorySearching ? "Loading..." : "No consumption records found."}
                                isLoading={isHistorySearching}
                            />
                            <PaginationControls
                                currentPage={currentPageConsume}
                                totalPages={Math.ceil(consumeHistory.length / ITEMS_PER_PAGE)}
                                totalRecords={consumeHistory.length}
                                pageSize={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPageConsume}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}