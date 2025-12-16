"use client"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { History, Search, Calendar } from "lucide-react"
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
import { cn } from "@/lib/utils"

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
    
    // States
    const [terminalSearchQuery, setTerminalSearchQuery] = useState("") 
    const [filteredTerminals, setFilteredTerminals] = useState<Terminal[]>([]) 
    const [isTerminalLoading, setIsTerminalLoading] = useState(false)
    const [selectedTerminalId, setSelectedTerminalId] = useState<string>("")
    const [highlightDropdown, setHighlightDropdown] = useState(false)
    const [searchDate, setSearchDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [consumeHistory, setConsumeHistory] = useState<TerminalTransaction[]>([])
    const [isHistorySearching, setIsHistorySearching] = useState(false)

    // Auto-Search Effect
    useEffect(() => {
        const fetchFilteredTerminals = async () => {
            if (!terminalSearchQuery.trim()) {
                setFilteredTerminals([]);
                setHighlightDropdown(false);
                return;
            }

            setIsTerminalLoading(true);
            setHighlightDropdown(false); 
            
            try {
                const response = await itPoswfService.searchTerminals(terminalSearchQuery);
                if (response.success && response.data) {
                    setFilteredTerminals(response.data.slice(0, 30)); 
                    if (response.data.length > 0) {
                         setHighlightDropdown(true); 
                         const exactMatch = response.data.find(t => t.id === terminalSearchQuery);
                         if (!exactMatch) {
                             toast({ 
                                 title: "Terminals Found", 
                                 description: `Found ${response.data.length} matches. Please select one from the list.`,
                                 duration: 3000 
                             });
                         }
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

    const matchingTerminal = filteredTerminals.find(t => 
        t.id === terminalSearchQuery.trim() || 
        t.terminalName.toLowerCase() === terminalSearchQuery.trim().toLowerCase()
    );

    const handleHistorySearch = async () => {
        let finalTerminalId = selectedTerminalId || matchingTerminal?.id || terminalSearchQuery.trim();

        if (!finalTerminalId) {
            toast({ title: "Input Required", description: "Please enter a Terminal ID or Name.", variant: "default" });
            return;
        }

        setIsHistorySearching(true);
        setConsumeHistory([]);

        try {
            const response = await itPoswfService.searchTerminalHistory(finalTerminalId, searchDate);

            if (response.success && response.data) {
                setConsumeHistory(response.data.consumeHistory);
                
                if (!selectedTerminalId && matchingTerminal) {
                    setSelectedTerminalId(matchingTerminal.id);
                }

                if (response.data.consumeHistory.length === 0) {
                     toast({ title: "Search Complete", description: `No consumption history found for terminal ${finalTerminalId} on ${searchDate}.` });
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

    const commonColumns: TableColumn<TerminalTransaction>[] = [
        { header: "Trx ID", accessor: "trxID", cell: (value) => <span className="font-medium">{value}</span> },
        { header: "Invoice No", accessor: "invoiceNo" },
        { header: "Trx Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> },
        { header: "Amount", accessor: "amount", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
        { header: "Created Date", accessor: "createdDate", cell: (value) => formatHistoryDate(value) },
        { header: "Status", accessor: "recordStatus", cell: (value) => <StatusBadge status={value} /> },
        { header: "Created By", accessor: "createdBy" },
    ];

    const isButtonEnabled = terminalSearchQuery.trim().length > 0 || !!selectedTerminalId;

    return (
        <div className="space-y-6">
            <Card>
                <CardContent>
                    {/* RESPONSIVE LAYOUT:
                        - Mobile: Grid 1 col (Vertical Stack)
                        - Tablet (md): Grid 2 cols (2x2 Grid)
                        - Desktop (lg): Flex Row (Single Line)
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:flex-row gap-4 items-end pt-6 lg:justify-start">
                        
                        {/* 1. Search Input 
                           - Mobile/Tablet: w-full 
                           - Desktop: flex-1 (fills space)
                        */}
                        <div className="w-full lg:flex-1 space-y-2">
                            <Label htmlFor="terminal-search-input" className="text-sm font-medium">
                                Terminal Search / ID
                            </Label>
                            <Input
                                id="terminal-search-input"
                                placeholder={isTerminalLoading ? "Loading..." : "Enter ID (e.g. 383) or Name"}
                                value={terminalSearchQuery}
                                onChange={(e) => setTerminalSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && isButtonEnabled && handleHistorySearch()} 
                                className="h-11"
                            />
                        </div>

                        {/* 2. Select Dropdown 
                           - Mobile/Tablet: w-full
                           - Desktop: Fixed 250px
                        */}
                        <div className="w-full lg:w-[250px] space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Label htmlFor="terminalId-select" className="text-sm font-medium mb-0">
                                    Select Terminal (Optional)
                                </Label>
                                {highlightDropdown && !selectedTerminalId && (
                                    <span className="relative flex h-2.5 w-2.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                    </span>
                                )}
                            </div>

                            <Select 
                                value={selectedTerminalId} 
                                onValueChange={(val) => {
                                    setSelectedTerminalId(val);
                                    setHighlightDropdown(false);
                                }}
                                disabled={filteredTerminals.length === 0}
                            >
                                <SelectTrigger 
                                    id="terminalId-select" 
                                    className={cn(
                                        "h-11 transition-all duration-300",
                                        highlightDropdown && !selectedTerminalId ? "border-amber-500 ring-2 ring-amber-200" : ""
                                    )}
                                >
                                    <SelectValue placeholder={
                                        filteredTerminals.length === 0 
                                            ? (terminalSearchQuery ? "No matches" : "Select...") 
                                            : `Select from ${filteredTerminals.length} results`
                                    } />
                                </SelectTrigger>
                                <SelectContent>
                                    {filteredTerminals.map((terminal) => (
                                        <SelectItem key={terminal.id} value={terminal.id}>
                                            {`${terminal.terminalName} (${terminal.id})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 3. Date Picker
                           - Mobile/Tablet: w-full
                           - Desktop: Fixed 180px
                        */}
                        <div className="w-full lg:w-[180px] space-y-2">
                            <Label htmlFor="search-date" className="text-sm font-medium">
                                Search Date
                            </Label>
                            <Input
                                id="search-date"
                                type="date"
                                value={searchDate}
                                onChange={(e) => setSearchDate(e.target.value)}
                                className="h-11"
                            />
                        </div>

                        {/* 4. Search Button 
                           - Mobile/Tablet: w-full
                           - Desktop: Auto width (fit text)
                        */}
                        <div className="w-full lg:w-auto space-y-2">
                            <Button onClick={handleHistorySearch} 
                                    disabled={!isButtonEnabled || isHistorySearching} 
                                    className="h-11 px-8 w-full lg:w-auto">
                                <Search className="mr-2 h-4 w-4" />
                                {isHistorySearching ? "Searching..." : "Search"}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardContent className="space-y-4 pt-6">
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