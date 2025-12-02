// components/themepark-support/tabs/Transaction/ConsumeTerminalTab.tsx
"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { History, Search, Wallet, ShoppingBag } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { itPoswfService } from "@/services/themepark-support"
import { 
    type Terminal, 
    type TerminalPurchaseHistory, 
    type TerminalConsumeHistory 
} from "@/type/themepark-support"

// Date formatter reuse
function formatHistoryDate(dateString: string): string {
    if (!dateString) return "—";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false
    }).replace(',', '');
}

export default function ConsumeTerminalTab() {
    const { toast } = useToast();
    
    // Terminal Search States
    const [terminalSearchQuery, setTerminalSearchQuery] = useState("") 
    const [filteredTerminals, setFilteredTerminals] = useState<Terminal[]>([]) 
    const [isTerminalLoading, setIsTerminalLoading] = useState(false)
    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")

    // History Search States
    const [purchaseHistory, setPurchaseHistory] = useState<TerminalPurchaseHistory[]>([])
    const [consumeHistory, setConsumeHistory] = useState<TerminalConsumeHistory[]>([])
    const [isHistorySearching, setIsHistorySearching] = useState(false)


    // --- Terminal Search Logic with Debounce ---
    useEffect(() => {
        const fetchFilteredTerminals = async () => {
            setIsTerminalLoading(true);
            setSelectedTerminalId(""); 
            
            try {
                const response = await itPoswfService.searchTerminals(terminalSearchQuery);
                if (response.success && response.data) {
                    setFilteredTerminals(response.data.slice(0, 30)); 
                } else {
                    setFilteredTerminals([]);
                }
            } catch (error) {
                console.error("Network error fetching terminals:", error);
                setFilteredTerminals([]);
            } finally {
                setIsTerminalLoading(false);
            }
        };
        
        const debounceTimeout = setTimeout(() => {
            fetchFilteredTerminals();
        }, 300);

        return () => clearTimeout(debounceTimeout);
    }, [terminalSearchQuery]);

    useEffect(() => {
        if (selectedTerminalId && !filteredTerminals.some(t => t.id === selectedTerminalId)) {
            setSelectedTerminalId(""); 
        }
    }, [filteredTerminals, selectedTerminalId]);

    // --- Main History Search Logic ---
    const handleHistorySearch = async () => {
        if (!selectedTerminalId) {
            toast({ title: "Input Required", description: "Please select a Terminal ID.", variant: "default" });
            return;
        }

        setIsHistorySearching(true);
        setPurchaseHistory([]);
        setConsumeHistory([]);

        try {
            const response = await itPoswfService.searchTerminalHistory(selectedTerminalId);

            if (response.success && response.data) {
                setPurchaseHistory(response.data.purchaseHistory);
                setConsumeHistory(response.data.consumeHistory);

                if (response.data.purchaseHistory.length === 0 && response.data.consumeHistory.length === 0) {
                     toast({ title: "Search Complete", description: "No history found for this terminal." });
                } else {
                     toast({ title: "Search Complete", description: "History data retrieved." });
                }
            } else {
                toast({ title: "Search Failed", description: response.error || "Could not retrieve history.", variant: "destructive" });
            }
        } catch (error) {
            console.error("History Search Error:", error);
            toast({ title: "Network Error", description: "Failed to connect to the history service.", variant: "destructive" });
        } finally {
            setIsHistorySearching(false);
        }
    }

    // --- DataTable Column Definitions ---
    const purchaseColumns: TableColumn<TerminalPurchaseHistory>[] = [
        { header: "Invoice No", accessor: "invoiceNo" },
        { header: "Package Name", accessor: "packageName" },
        { header: "Amount", accessor: "amount", cell: (value) => `RM ${value.toFixed(2)}` },
        { header: "Customer Email", accessor: "customerEmail" },
        { header: "Purchase Date", accessor: "purchaseDate", cell: (value) => formatHistoryDate(value) },
        { header: "Status", accessor: "paymentStatus", cell: (value) => <StatusBadge status={value} /> },
    ];

    const consumeColumns: TableColumn<TerminalConsumeHistory>[] = [
        { header: "Consumption No", accessor: "consumptionNo" },
        { header: "Item Consumed", accessor: "itemConsumed" },
        { header: "Quantity", accessor: "quantity" },
        { header: "Terminal ID", accessor: "terminalID" },
        { header: "Consume Date", accessor: "consumeDate", cell: (value) => formatHistoryDate(value) },
        { header: "Status", accessor: "status", cell: (value) => <StatusBadge status={value} /> },
    ];


    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        
                        {/* 1. Terminal Search Input */}
                        <div className="space-y-2">
                            <Label htmlFor="terminal-search-input" className="text-sm font-medium">
                                Terminal Search
                            </Label>
                            <Input
                                id="terminal-search-input"
                                placeholder={isTerminalLoading ? "Loading..." : "Search terminal name or ID"}
                                value={terminalSearchQuery}
                                onChange={(e) => setTerminalSearchQuery(e.target.value)}
                                className="h-11"
                                disabled={isTerminalLoading}
                            />
                        </div>

                        {/* 2. Select Terminal ID */}
                        <div className="space-y-2">
                            <Label htmlFor="terminalId-select" className="text-sm font-medium">
                                Select Terminal ID
                            </Label>
                            <Select 
                                value={selectedTerminalId} 
                                onValueChange={setSelectedTerminalId}
                                disabled={isTerminalLoading}
                            >
                                <SelectTrigger id="terminalId-select" className="h-11">
                                    <SelectValue placeholder={isTerminalLoading ? "Searching..." : "Select terminal"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredTerminals.length === 0 ? (
                                        <SelectItem value="no-results" disabled>
                                            {terminalSearchQuery.length > 0 ? "No results found" : "Start typing to search"}
                                        </SelectItem>
                                    ) : (
                                        filteredTerminals.map((terminal) => (
                                            <SelectItem key={terminal.id} value={terminal.id}>
                                                {`${terminal.terminalName} (${terminal.id})`}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Search Button */}
                        <div className="space-y-2 flex flex-col justify-end">
                            <div className="h-6"></div>
                            <Button onClick={handleHistorySearch} disabled={isHistorySearching || !selectedTerminalId} className="h-11 px-8 w-full">
                                <Search className="mr-2 h-4 w-4" />
                                {isHistorySearching ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="purchase" className="w-full">
                <TabsList className="inline-flex bg-transparent p-0 h-auto gap-0 rounded-none border-0 mb-0">
                    <TabsTrigger
                        value="purchase"
                        className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border data-[state=active]:border-b-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:relative data-[state=active]:z-10 data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b-border"
                    >
                        Purchase History ({purchaseHistory.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="consume"
                        className="rounded-t-lg rounded-b-none bg-card px-6 py-2.5 text-sm font-medium border border-border -ml-px data-[state=active]:border-b-transparent data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm data-[state=active]:relative data-[state=active]:z-10 data-[state=inactive]:bg-muted/30 data-[state=inactive]:text-muted-foreground data-[state=inactive]:border-b-border"
                    >
                        Consume History ({consumeHistory.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="purchase" className="mt-0">
                    <Card className="rounded-tl-none">
                        <CardContent>
                            <DataTable
                                columns={purchaseColumns}
                                data={purchaseHistory}
                                keyExtractor={(row) => row.id} 
                                emptyMessage={isHistorySearching ? "Loading Purchase History..." : "No purchase records found for this terminal."}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="consume" className="mt-0">
                    <Card className="rounded-tl-none">
                        <CardContent>
                            <DataTable
                                columns={consumeColumns}
                                data={consumeHistory}
                                keyExtractor={(row) => row.id}
                                emptyMessage={isHistorySearching ? "Loading Consume History..." : "No consumption records found for this terminal."}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}