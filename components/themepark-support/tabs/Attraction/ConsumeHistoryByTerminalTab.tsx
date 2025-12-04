// components/themepark-support/tabs/Attraction/ConsumeHistoryByTerminalTab.tsx
"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { History, Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { useToast } from "@/hooks/use-toast"
import { itPoswfService } from "@/services/themepark-support"
import { 
    type Terminal, 
    type TerminalTransaction, 
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

export default function ConsumeHistoryByTerminalTab() {
    const { toast } = useToast();
    
    // Terminal Search States
    const [terminalSearchQuery, setTerminalSearchQuery] = useState("") 
    const [filteredTerminals, setFilteredTerminals] = useState<Terminal[]>([]) 
    const [isTerminalLoading, setIsTerminalLoading] = useState(false)
    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")

    // History Search States (Only need consume history)
    const [consumeHistory, setConsumeHistory] = useState<TerminalTransaction[]>([])
    const [isHistorySearching, setIsHistorySearching] = useState(false)


    // --- Terminal Search Logic with Debounce ---
    useEffect(() => {
        const fetchFilteredTerminals = async () => {
            setIsTerminalLoading(true);
            
            if (terminalSearchQuery.trim().length > 0) {
                 setSelectedTerminalId("");
            }
            
            try {
                const query = terminalSearchQuery.trim();
                const response = await itPoswfService.searchTerminals(query);
                
                if (response.success && response.data) {
                    const terminals = response.data.slice(0, 30);
                    setFilteredTerminals(terminals); 
                    
                    // Auto-select logic: If exact ID/Name matches single result, auto-select it.
                    if (terminals.length === 1 && (terminals[0].id === query || terminals[0].terminalName.toLowerCase() === query.toLowerCase())) {
                        setSelectedTerminalId(terminals[0].id);
                    }
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

    // Clear selection if the search query updates and invalidates the current selection
    useEffect(() => {
        if (selectedTerminalId && !filteredTerminals.some(t => t.id === selectedTerminalId)) {
            setSelectedTerminalId(""); 
        }
    }, [filteredTerminals, selectedTerminalId]);
    
    // NEW: Computed properties for button enablement
    const matchingTerminal = filteredTerminals.find(t => 
        t.id === terminalSearchQuery.trim() || 
        t.terminalName.toLowerCase() === terminalSearchQuery.trim().toLowerCase()
    );
    const isButtonDisabled = isHistorySearching || (!selectedTerminalId && !matchingTerminal);


    // --- Main History Search Logic ---
    const handleHistorySearch = async () => {
        let finalTerminalId = selectedTerminalId;
        
        // Fallback to matched ID if no explicit selection (solves the "type ID and search" issue)
        if (!finalTerminalId && matchingTerminal) {
            finalTerminalId = matchingTerminal.id;
        }

        if (!finalTerminalId) {
            toast({ title: "Input Required", description: "Please enter or select a valid Terminal ID.", variant: "default" });
            return;
        }

        setIsHistorySearching(true);
        setConsumeHistory([]);

        try {
            // Use the existing service that fetches BOTH purchase and consume history
            const response = await itPoswfService.searchTerminalHistory(finalTerminalId);

            if (response.success && response.data) {
                // CRITICAL DIFFERENCE: ONLY use consumeHistory
                setConsumeHistory(response.data.consumeHistory);

                // Auto-select the terminal ID after a successful search if it wasn't selected before
                if (finalTerminalId && finalTerminalId !== selectedTerminalId) {
                    setSelectedTerminalId(finalTerminalId);
                }

                if (response.data.consumeHistory.length === 0) {
                     toast({ title: "Search Complete", description: "No consumption history found for this terminal." });
                } else {
                     toast({ title: "Search Complete", description: "Consumption history retrieved." });
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

    // --- DataTable Column Definitions (Same as ConsumeTerminalTab) ---
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
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        
                        {/* 1. Terminal Search Input */}
                        <div className="space-y-2">
                            <Label htmlFor="terminal-search-input" className="text-sm font-medium">
                                Terminal Search (ID or Name)
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
                            <Button onClick={handleHistorySearch} disabled={isButtonDisabled} className="h-11 px-8 w-full">
                                <Search className="mr-2 h-4 w-4" />
                                {isHistorySearching ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <History className="h-5 w-5 text-muted-foreground" />
                        Consume History ({consumeHistory.length})
                    </div>
                    <DataTable
                        columns={commonColumns}
                        data={consumeHistory}
                        keyExtractor={(row) => row.id}
                        emptyMessage={isHistorySearching ? "Loading Consume History..." : "No consumption records found for this terminal."}
                    />
                </CardContent>
            </Card>
        </div>
    )
}