// components/themepark-support/tabs/Ticket/ManualConsumeTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Wallet, TrendingUp, AlertTriangle } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { BalanceCard } from "@/components/themepark-support/it-poswf/balance-card"
import {
  type AvailableTicket,
  type ManualConsumeData,
  type ManualConsumeSearchPayload,
  type ConsumeTicketItem,
  type TicketConsumeExecutePayload,
  type Terminal,
} from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"


export default function ManualConsumeTab() {
  const { toast } = useToast()

  const [consumeType, setConsumeType] = useState<string>("")
  const [email, setEmail] = useState("")
  const [mobileNo, setMobileNo] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [terminalId, setTerminalId] = useState<string>("")
  const [ticketType, setTicketType] = useState<string>("")
  const [ticketStatus, setTicketStatus] = useState<string>("")
  
  // NEW STATE: Search term for the Terminal dropdown/search
  const [terminalSearchQuery, setTerminalSearchQuery] = useState("") 
  // NEW STATE: List of terminals filtered by the search query
  const [filteredTerminals, setFilteredTerminals] = useState<Terminal[]>([]) 
  const [isTerminalLoading, setIsTerminalLoading] = useState(false)
  
  const [consumeSearchResult, setConsumeSearchResult] = useState<ManualConsumeData | null>(null)
  const [isConsumeSearching, setIsConsumeSearching] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)


  const isExecutionBlocked = !consumeSearchResult || 
                             consumeSearchResult.tickets.length === 0 ||
                             consumeSearchResult.tickets.filter(t => t.PackageStatus.toLowerCase() === 'active').length === 0;


  const isSuperApp = consumeType === "superapp";
  const isReceipt = consumeType === "receipt";
  const isEmailDisabled = isReceipt;
  const isMobileDisabled = isReceipt;
  const isInvoiceDisabled = isSuperApp;


  // --- MODIFIED EFFECT: Fetch terminals based on search query with DEBOUNCE ---
  useEffect(() => {
    const fetchFilteredTerminals = async () => {
        // Only trigger search if the query is non-empty or if the list is initially empty.
        if (terminalSearchQuery.length === 0 && filteredTerminals.length > 0) {
            return;
        }

        setIsTerminalLoading(true);
        // Clear selected terminal when search starts
        setTerminalId(""); 
        
        try {
            // Use searchTerminals with the input query
            const response = await itPoswfService.searchTerminals(terminalSearchQuery);
            if (response.success && response.data) {
                // Cap results to 30 items for performance/safety
                setFilteredTerminals(response.data.slice(0, 30)); 
            } else {
                setFilteredTerminals([]);
                if (terminalSearchQuery.length > 0) {
                     toast({ 
                        title: "Terminal Search Failed", 
                        description: "Could not retrieve terminals. Try refining your search.", 
                        variant: "destructive" 
                    });
                }
            }
        } catch (error) {
            console.error("Network error fetching terminals:", error);
            setFilteredTerminals([]);
        } finally {
            setIsTerminalLoading(false);
        }
    };
    
    // Implement Debounce: Wait 300ms after user stops typing
    const debounceTimeout = setTimeout(() => {
        fetchFilteredTerminals();
    }, 300);

    return () => clearTimeout(debounceTimeout);
    
  }, [terminalSearchQuery]);
  
  // Effect to handle clearing selected ID if it disappears from the search results
  useEffect(() => {
      if (terminalId && !filteredTerminals.some(t => t.id === terminalId)) {
          // If the selected ID is no longer in the displayed list, clear the selected value.
          setTerminalId(""); 
      }
  }, [filteredTerminals, terminalId]);

  // Handle manual search logic
  const handleConsumeSearch = async () => {
    let missingFields: string[] = [];

    if (!consumeType) missingFields.push("Consume Type");
    // Ensure both the search query AND a selected ID are present
    if (!terminalSearchQuery.trim() || !terminalId) missingFields.push("Terminal ID (Search & Select)");
    if (!ticketType) missingFields.push("Ticket Type");
    if (!ticketStatus) missingFields.push("Ticket Status");

    if (isSuperApp) {
        if (!email.trim()) missingFields.push("Email Address");
    } else if (isReceipt) {
        if (!invoiceNo.trim()) missingFields.push("Invoice No");
    }

    if (missingFields.length > 0) {
        const missingFieldsStr = missingFields.join(", ");
        toast({
            title: "Input Required",
            description: `Please fill in all required search criteria: ${missingFieldsStr}.`,
            variant: "default",
        });
        return;
    }
    
    setIsConsumeSearching(true);
    setConsumeSearchResult(null);

    const searchPayload: ManualConsumeSearchPayload = {
        searchType: consumeType.toUpperCase(),
        email: email.trim(), 
        mobile: mobileNo.trim(), 
        invoiceNo: invoiceNo.trim(),
        terminalID: terminalId, // Use the selected ID
        ticketType: ticketType.toUpperCase(),
        ticketStatus: ticketStatus.toUpperCase(),
        SourceType: ticketType.toUpperCase(), 
    };
    // ... (rest of search logic remains the same)
    
    try {
        const response = await itPoswfService.searchManualConsume(searchPayload);

        if (response.success && response.data) {
            if (isSuperApp && !response.data.accID) {
                 toast({ 
                    title: "Account Data Missing", 
                    description: "Search successful, but Account ID (accID) is missing for Superapp consumption.", 
                    variant: "destructive" 
                });
                setConsumeSearchResult(null); 
                return;
            }
            if (!response.data.myQr) { 
                toast({ 
                    title: "System Data Missing", 
                    description: "Search successful, but QR Data (myQr) is missing for execution.", 
                    variant: "destructive" 
                });
            }

            setConsumeSearchResult(response.data);
            toast({ 
                title: "Search Complete",
                 description: "Manual consume details retrieved.", 
                 variant: "default" });

        } else {
            setConsumeSearchResult(null);
            toast({
                title: "Search Failed",
                description: response.error || "No data found matching the search criteria.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Manual Consume Search Error:", error);
        setConsumeSearchResult(null);
        toast({
            title: "Network Error",
            description: "Failed to connect to the search service.",
            variant: "destructive"
        });
    } finally {
        setIsConsumeSearching(false);
    }
  }

    const handleConsumeExecute = async () => {
        if (!consumeSearchResult) return;
        
        const ticketsToConsume = consumeSearchResult.tickets.filter(t => t.PackageStatus.toLowerCase() === 'active');

        if (ticketsToConsume.length === 0) {
            toast({ 
                title: "Action Blocked", 
                description: "No ACTIVE tickets available to consume.",
                 variant: "default" });
            return;
        }
        
        const consumeList: ConsumeTicketItem[] = ticketsToConsume.map(item => ({
            PackageName: item.PackageName,
            ItemName: item.ItemName,
            TicketType: item.TicketType,
            PackageID: item.PackageID,
            PackageItemID: item.PackageItemID,
            TicketItemID: Number(item.id), 
            ConsumeQty: 1, 
        }));

        const numericTerminalId = Number(terminalId.split('-').pop() || terminalId) || 0; 
        
        const executePayload: TicketConsumeExecutePayload = {
            terminalID: numericTerminalId,
            myQrData: consumeSearchResult.myQr ?? null, 
            custEmail: email.trim(),
            mobileNo: mobileNo.trim() || "",
            invoiceNo: invoiceNo.trim() || "", 
            creditBalance: consumeSearchResult.creditBalance,
            totalAmount: ticketsToConsume.reduce((sum, item) => sum + (item.ItemPoint ?? 0), 0),
            itemNamesForEmail: ticketsToConsume.map(i => i.ItemName).join(', '),
            consumeList: consumeList,
        };
        
        setIsExecuting(true);

        try {
            const response = await itPoswfService.executeManualConsume(executePayload);
            
            if (response.success) {
                setConsumeSearchResult(null);
                setEmail("");
                setInvoiceNo("");
                toast({ 
                    title: "Consumption Success", 
                    description: `Package consumption executed successfully.`,
                    variant: "default"
                });
            } else {
                throw new Error(response.error || "Consumption failed.");
            }
        } catch (error) {
            console.error("Consume Execute Error:", error);
            toast({
                title: "Consumption Failed",
                description: error instanceof Error ? error.message : "An unexpected error occurred during execution.",
                variant: "destructive"
            });
        } finally {
            setIsExecuting(false);
        }
    }

  const ticketColumns: TableColumn<AvailableTicket>[] = [
    { header: "Package Name", accessor: "PackageName", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Item Name", accessor: "ItemName" },
    { header: "Terminal ID", accessor: "ConsumeTerminal" },
    { header: "Type", accessor: "TicketType" },
    { header: "Points", accessor: "ItemPoint", cell: (value) => value.toLocaleString() },
    { header: "Balance Qty", accessor: "BalanceQty" },
    { header: "Status", accessor: "PackageStatus", cell: (value) => <StatusBadge status={value} /> },
  ]
  
  const totalActiveTickets = consumeSearchResult?.tickets.filter(t => t.PackageStatus.toLowerCase() === 'active').length ?? 0;
  const totalExpiredTickets = consumeSearchResult?.tickets.filter(t => t.PackageStatus.toLowerCase() === 'expired').length ?? 0;

  return (
    <>
      <Card>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* 1. Consume Type (R1, C1) */}
            <div className="space-y-2">
              <Label htmlFor="consumeType" className="text-sm font-medium">
                Consume Type
              </Label>
              <Select value={consumeType} onValueChange={setConsumeType}>
                <SelectTrigger id="consumeType" className="h-11">
                  <SelectValue placeholder="Select consume type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="superapp">By Superapp</SelectItem>
                  <SelectItem value="receipt">By Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 2. Email Address (R1, C2) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address <span className="text-muted-foreground">{isSuperApp && "(Required)"}</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:opacity-100 disabled:cursor-not-allowed"
                disabled={isEmailDisabled}
              />
            </div>

            {/* 3. Mobile No (R1, C3) */}
            <div className="space-y-2">
              <Label htmlFor="mobileNo" className="text-sm font-medium">
                Mobile No <span className="text-muted-foreground">{isSuperApp && "(Optional)"}</span>
              </Label>
              <Input
                id="mobileNo"
                type="tel"
                placeholder="Enter mobile number"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                className="h-11 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:opacity-100 disabled:cursor-not-allowed"
                disabled={isMobileDisabled}
              />
            </div>
            
            {/* 4. Invoice No (R2, C1) */}
            <div className="space-y-2">
              <Label htmlFor="invoiceNo" className="text-sm font-medium">
                Invoice No <span className="text-muted-foreground">{isReceipt && "(Required)"}</span>
              </Label>
              <Input
                id="invoiceNo"
                placeholder="Enter invoice number"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="h-11 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:opacity-100 disabled:cursor-not-allowed"
                disabled={isInvoiceDisabled}
              />
            </div>

            {/* 5. Terminal Search Input (R2, C2) */}
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

            {/* 6. Terminal ID Select (R2, C3) - Filtered Select */}
            <div className="space-y-2">
              <Label htmlFor="terminalId" className="text-sm font-medium">
                Select Terminal ID
              </Label>
              <Select 
                value={terminalId} 
                onValueChange={setTerminalId}
                disabled={isTerminalLoading}
              >
                <SelectTrigger id="terminalId" className="h-11">
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

            {/* 7. Ticket Type (R3, C1) */}
            <div className="space-y-2">
              <Label htmlFor="ticketType" className="text-sm font-medium">
                Ticket Type
              </Label>
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger id="ticketType" className="h-11">
                  <SelectValue placeholder="Select ticket type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="reward">Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 8. Ticket Status (R3, C2) */}
            <div className="space-y-2">
              <Label htmlFor="ticketStatus" className="text-sm font-medium">
                Ticket Status
              </Label>
              <Select value={ticketStatus} onValueChange={setTicketStatus}>
                <SelectTrigger id="ticketStatus" className="h-11">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 9. Search Button (R3, C3) - Aligned to the far right of the remaining area */}
            <div className="space-y-2 flex flex-col justify-end items-end"> 
              <div className="h-6"></div>
             <Button 
                onClick={handleConsumeSearch} 
                disabled={isConsumeSearching} 
                className="h-11 w-40" // Fixed width button
             >
                <Search className="mr-2 h-4 w-4" />
                {isConsumeSearching ? "Searching..." : "Search"}
              </Button>
            </div>
            
          </div>
        </CardContent>
      </Card>

      {consumeSearchResult && (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <BalanceCard
              title="Credit Balance"
              amount={consumeSearchResult.creditBalance}
              description="Available balance"
              icon={Wallet}
              valueColor="text-green-600"
            />
            <Card>
              <CardContent className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Ticket Summary</div>
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className={`text-2xl font-bold`}>
                      {totalActiveTickets} Active, {totalExpiredTickets} Expired
                  </div>
                  <p className="text-xs text-muted-foreground">Only active tickets can be consumed.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="text-sm font-medium">Available Packages/Tickets ({consumeSearchResult.tickets.length})</div>
              
              <div className="overflow-y-auto max-h-[300px] border border-border rounded-lg">
                <DataTable
                  columns={ticketColumns}
                  data={consumeSearchResult.tickets}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No available tickets found"
                />
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <Button 
                    onClick={handleConsumeExecute} 
                    disabled={isExecuting || isExecutionBlocked} 
                    className="w-full"
                >
                    {isExecuting ? "Executing..." : "Execute Consumption"}
                </Button>
                {isExecutionBlocked && (
                     <div className="text-center text-sm text-red-500 font-medium flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Execution blocked: No active tickets found.
                    </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}