// components/themepark-support/tabs/Ticket/ManualConsumeTab.tsx
"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge" 
import { Separator } from "@/components/ui/separator"
import { Search, Wallet, Ticket, ArrowLeft, CheckCircle2, Loader2, Minus, Plus, SearchX, AlertTriangle } from "lucide-react"
import { BalanceCard } from "@/components/shared-components/balance-card"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { TerminalSelector } from "@/components/shared-components/terminal-selector"
import {
  type ManualConsumeData,
  type ManualConsumeSearchPayload,
  type ConsumeTicketItem,
  type TicketConsumeExecutePayload,
  type AvailableTicket
} from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { cn } from "@/lib/utils"
import { CONSUME_TYPES, TICKET_TYPES, TICKET_STATUSES } from "@/lib/constants"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { PaginationControls } from "@/components/ui/pagination-controls"

type Step = 'selection' | 'confirmation';

export default function ManualConsumeTab() {
  const toast = useAppToast()
  const [currentStep, setCurrentStep] = useState<Step>('selection');

  // -- Form State --
  const [consumeType, setConsumeType] = useState<string>("superapp")
  const [email, setEmail] = useState("")
  const [mobileNo, setMobileNo] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [ticketType, setTicketType] = useState<string>("")
  const [ticketStatus, setTicketStatus] = useState<string>("")
  
  // -- Terminal Search State --
  const [terminalId, setTerminalId] = useState<string>("")
  
  // -- Data & Cart State --
  const [consumeSearchResult, setConsumeSearchResult] = useState<ManualConsumeData | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({}) 
  
  // -- Loading States --
  const [isConsumeSearching, setIsConsumeSearching] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // -- Pagination State --
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const isSuperApp = consumeType === "superapp";
  const isReceipt = consumeType === "receipt";

  // --- 1. Main Search Logic ---
  const handleConsumeSearch = async (query?: string) => {
    let typeToUse = consumeType;
    let emailToUse = email;
    let invoiceToUse = invoiceNo;

    if (query) {
        if (query.includes("@")) {
            typeToUse = "superapp";
            emailToUse = query;
            setConsumeType("superapp");
            setEmail(query);
        } else {
            typeToUse = "receipt";
            invoiceToUse = query;
            setConsumeType("receipt");
            setInvoiceNo(query);
        }
    }

    let missingFields: string[] = [];

    if (!query) {
        if (!typeToUse) missingFields.push("Consume Type");
        if (!terminalId) missingFields.push("Terminal");
        
        if (typeToUse === "superapp" && !emailToUse.trim()) missingFields.push("Email Address");
        if (typeToUse === "receipt" && !invoiceToUse.trim()) missingFields.push("Invoice No");

        if (missingFields.length > 0) {
            toast.info("Input Required", `Missing: ${missingFields.join(", ")}`);
            return;
        }
    } else {
        if (!terminalId) return;
    }
    
    setIsConsumeSearching(true);
    setConsumeSearchResult(null);
    setQuantities({}); 
    setCurrentPage(1);
    setCurrentStep('selection');

    const searchPayload: any = {
        searchType: typeToUse.toUpperCase(),
        email: emailToUse.trim(), 
        mobile: mobileNo.trim(), 
        invoiceNo: invoiceToUse.trim(),
        terminalID: terminalId,
        ticketType: ticketType.toUpperCase(),
        ticketStatus: ticketStatus.toUpperCase(),
    };
    
    try {
        const response = await itPoswfService.searchManualConsume(searchPayload);

        if (response.success && response.data) {
            const hasTickets = response.data.tickets && response.data.tickets.length > 0;

            if (!hasTickets) {
                setConsumeSearchResult(response.data);
                return; 
            }

            if (typeToUse === "superapp" && !response.data.accID) {
                 toast.error("Account Data Missing", "Account ID is missing.");
                return;
            }
            
            setConsumeSearchResult(response.data);
            toast.success("Search Complete", `Found ${response.data.tickets.length} tickets.`);

        } else {
            if (!query) toast.error("Search Failed", response.error || "No data found.");
        }
    } catch (error) {
        console.error("Manual Consume Search Error:", error);
        if(!query) toast.error("Network Error", "Failed to connect to service.");
    } finally {
        setIsConsumeSearching(false);
    }
  }

  useAutoSearch(handleConsumeSearch);

  // --- 3. Quantity Handlers ---
  const updateQuantity = (itemId: string, val: number, maxQty: number) => {
      setQuantities(prev => {
          // Ensure quantity doesn't exceed balanceQty (maxQty)
          const updated = Math.min(Math.max(0, val), maxQty); 
          const newMap = { ...prev, [itemId]: updated };
          if (updated === 0) delete newMap[itemId]; 
          return newMap;
      });
  };

  // --- 4. Navigation ---
  const handleNextStep = () => {
      const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0);
      if (totalSelected === 0) {
          toast.info("Cart Empty", "Please select quantity for at least one ticket.");
          return;
      }
      setCurrentStep('confirmation');
  };

  const handleBackStep = () => {
      setCurrentStep('selection');
  };

  // --- 5. Execute Logic ---
  const handleConsumeExecute = async () => {
        if (!consumeSearchResult) return;
        
        const selectedTickets = consumeSearchResult.tickets.filter(t => (quantities[t.id] || 0) > 0);
        if (selectedTickets.length === 0) return;
        
        // Even if points are removed from UI, we assume 0 cost if not displayed.
        const totalPoints = selectedTickets.reduce((sum, item) => sum + (item.itemPoint * quantities[item.id]), 0);

        const consumeList: ConsumeTicketItem[] = selectedTickets.map(item => ({
            packageName: item.packageName,
            itemName: item.itemName,
            ticketType: item.ticketType,
            packageID: item.packageID,
            packageItemID: item.packageItemID,
            ticketItemID: item.ticketItemID, 
            consumeQty: quantities[item.id], 
        }));

        const numericTerminalId = Number(terminalId.split('-').pop() || terminalId) || 0; 
        
        const executePayload: any = {
            terminalID: numericTerminalId,
            myQrData: consumeSearchResult.myQr ?? null, 
            custEmail: email.trim(),
            mobileNo: mobileNo.trim() || "",
            invoiceNo: invoiceNo.trim() || "", 
            creditBalance: consumeSearchResult.creditBalance,
            totalAmount: totalPoints,
            itemNamesForEmail: selectedTickets.map(i => i.itemName).join(', '),
            consumeList: consumeList,
        };
        
        setIsExecuting(true);

        try {
            const response = await itPoswfService.executeManualConsume(executePayload);
            
            if (response.success) {
                setConsumeSearchResult(null);
                setQuantities({});
                setEmail("");
                setInvoiceNo("");
                setCurrentStep('selection');
                toast.success("Consumption Success", response.data?.message || "Tickets consumed successfully.");
            } else {
                throw new Error(response.error || "Consumption failed.");
            }
        } catch (error) {
            console.error("Consume Execute Error:", error);
            toast.error("Consumption Failed", error instanceof Error ? error.message : "An unexpected error occurred.");
        } finally {
            setIsExecuting(false);
        }
    }

  const activeTicketsCount = consumeSearchResult?.tickets.filter(t => t.packageStatus.toLowerCase() === 'active').length ?? 0;
  
  // --- Pagination Logic ---
  const paginatedTickets = useMemo(() => {
      if (!consumeSearchResult) return [];
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return consumeSearchResult.tickets.slice(start, start + ITEMS_PER_PAGE);
  }, [consumeSearchResult, currentPage]);

  const totalPages = consumeSearchResult ? Math.ceil(consumeSearchResult.tickets.length / ITEMS_PER_PAGE) : 0;

  // --- DATA TABLE COLUMNS ---
  const ticketColumns: TableColumn<AvailableTicket>[] = useMemo(() => [
    { 
        header: "Item Details", 
        accessor: "id", 
        className: "w-[50%] pl-6", // Increased width since we removed columns
        cell: (_, row) => (
            <div className="flex flex-col gap-1">
                <span className={cn("font-medium text-sm transition-colors", (quantities[row.id] || 0) > 0 ? "text-indigo-700 dark:text-indigo-300" : "text-foreground")}>
                    {row.packageName}
                </span>
                <span className="text-xs text-muted-foreground">
                    {row.itemName}
                </span>
                <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-mono bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800">
                        #{row.ticketItemID}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/80 font-mono">
                        <span>PID:{row.packageID}</span>
                        <span className="w-px h-3 bg-border"></span>
                        <span>PIID:{row.packageItemID}</span>
                    </div>
                </div>
            </div>
        )
    },
    { 
        header: "Type", 
        accessor: "ticketType", 
        className: "text-center",
        cell: (val) => <StatusBadge status={val} className="w-auto px-2" />
    },
    { 
        header: "Terminal", 
        accessor: "consumeTerminal", 
        className: "text-center text-xs font-mono text-muted-foreground" 
    },
    // NEW: Available / Balance Column
    { 
        header: "Available", 
        accessor: "balanceQty", 
        className: "text-center font-bold text-foreground",
        cell: (val) => val
    },
    // UPDATED: Quantity Selector
    { 
        header: "Consume Qty", 
        accessor: "id", 
        className: "text-right pr-6",
        cell: (_, row) => {
            const qty = quantities[row.id] || 0;
            const isActive = row.packageStatus.toLowerCase() === 'active';
            const maxQty = row.balanceQty; 

            return (
                <div className="flex items-center justify-end gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-l-md border-r-0"
                        onClick={() => updateQuantity(row.id, qty - 1, maxQty)}
                        disabled={!isActive || qty === 0}
                    >
                        <Minus className="h-3 w-3" />
                    </Button>
                    <Input 
                        type="number" 
                        className="h-7 w-12 text-center rounded-none border-x-0 focus-visible:ring-0 px-1"
                        value={qty.toString()}
                        onChange={(e) => updateQuantity(row.id, parseInt(e.target.value) || 0, maxQty)}
                        disabled={!isActive}
                    />
                    <Button variant="outline" size="icon" className="h-7 w-7 rounded-r-md border-l-0"
                        onClick={() => updateQuantity(row.id, qty + 1, maxQty)}
                        disabled={!isActive || qty >= maxQty}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </div>
            )
        }
    }
  ], [quantities]);

  // --- VIEW: SELECTION TABLE ---
  const renderSelectionView = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="grid gap-4 md:grid-cols-2">
            <BalanceCard
                title="Credit Balance"
                amount={consumeSearchResult?.creditBalance || 0}
                description="Available balance"
                icon={Wallet}
                valueColor="text-green-600"
            />
            <Card>
                <CardContent className="space-y-2 p-6">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Ticket Summary</div>
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold">
                        {activeTicketsCount} Active <span className="text-muted-foreground text-lg font-normal">/ {consumeSearchResult?.tickets.length || 0} Total</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Inactive/Expired tickets cannot be selected.</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardContent className="p-0 overflow-hidden">
                <div className="bg-muted/40 px-6 py-3 border-b flex justify-between items-center">
                    <h3 className="font-semibold flex items-center gap-2">
                        <Ticket className="w-4 h-4" /> Available Tickets
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {consumeSearchResult?.tickets.length} results found
                    </span>
                </div>

                <div className="p-0">
                    <DataTable
                        columns={ticketColumns}
                        data={paginatedTickets}
                        keyExtractor={(row) => row.id}
                        emptyIcon={SearchX}
                        emptyTitle="No Tickets Found"
                        emptyMessage="We couldn't find any tickets matching your search criteria."
                    />
                </div>
                
                {totalPages > 1 && (
                    <div className="px-6 pb-4">
                        <PaginationControls 
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalRecords={consumeSearchResult?.tickets.length}
                            pageSize={ITEMS_PER_PAGE}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            
                {/* STICKY FOOTER */}
                <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-6 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                            Total tickets selected: {Object.values(quantities).reduce((a, b) => a + b, 0)}
                        </div>
                        
                        <div className="flex items-center gap-6 w-full md:w-auto">
                            <Button 
                                onClick={handleNextStep} 
                                disabled={Object.keys(quantities).length === 0 || isExecuting} 
                                size="lg"
                                className="min-w-[150px]"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        </div>
    );
  };

  // --- VIEW: CONFIRMATION SUMMARY ---
  const renderConfirmationView = () => {
      const selectedTickets = consumeSearchResult?.tickets.filter(t => (quantities[t.id] || 0) > 0) || [];
      const creditBalance = consumeSearchResult?.creditBalance || 0;

      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Confirmation
                    </CardTitle>
                    <CardDescription>Please review the tickets to consume.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg border">
                        <span className="text-sm font-medium text-muted-foreground">Credit Balance</span>
                        <span className="text-xl font-bold text-primary">RM {creditBalance.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Selected Items:</h4>
                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                            {selectedTickets.map(ticket => {
                                const qty = quantities[ticket.id];
                                return (
                                    <div key={ticket.id} className="flex justify-between items-start text-sm border-b border-dashed pb-3 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-foreground">{ticket.packageName}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {ticket.itemName} <span className="mx-1">•</span> ID: {ticket.ticketItemID}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-foreground">x {qty}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/10 p-6">
                    <Button variant="outline" onClick={handleBackStep} disabled={isExecuting}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <LoadingButton 
                        onClick={handleConsumeExecute} 
                        isLoading={isExecuting} 
                        loadingText="Submitting..."
                        className="min-w-[140px]"
                    >
                        Confirm Consume
                    </LoadingButton>
                </CardFooter>
            </Card>
        </div>
      );
  };

  return (
    <>
      {currentStep === 'selection' && (
        <Card>
            <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-end">
                
                {/* ROW 1: Consume Type | Email | Mobile */}
                <div className="space-y-2">
                    <Label htmlFor="consumeType">Consume Type</Label>
                    <Select value={consumeType} onValueChange={setConsumeType}>
                        {/* Standardized h-11 */}
                        <SelectTrigger id="consumeType" className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            {CONSUME_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address {isSuperApp && "*"}</Label>
                    <Input 
                        id="email"
                        value={email} onChange={(e) => setEmail(e.target.value)} 
                        disabled={isReceipt} 
                        placeholder="customer@email.com"
                        className="h-11"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobileNo">Mobile No</Label>
                    <Input 
                        id="mobileNo"
                        value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} 
                        disabled={isReceipt}
                        className="h-11"
                    />
                </div>

                {/* ROW 2: Invoice No | Terminal Combobox | Ticket Type */}
                <div className="space-y-2">
                    <Label htmlFor="invoiceNo">Invoice No {isReceipt && "*"}</Label>
                    <Input 
                        id="invoiceNo"
                        value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} 
                        disabled={isSuperApp}
                        className="h-11"
                    />
                </div>
                
                 {/* Standardized Terminal Selector */}
                 <TerminalSelector 
                    value={terminalId}
                    onChange={setTerminalId}
                    label="Terminal Search & Select *"
                    className="h-11" 
                 />
                
                <div className="space-y-2">
                    <Label htmlFor="ticketType">Ticket Type</Label>
                    <Select value={ticketType} onValueChange={setTicketType}>
                        <SelectTrigger id="ticketType" className="!h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                        <SelectContent>
                            {TICKET_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* ROW 3: Ticket Status | [Empty] | Search Button */}
                <div className="space-y-2">
                    <Label htmlFor="ticketStatus">Ticket Status</Label>
                    <Select value={ticketStatus} onValueChange={setTicketStatus}>
                        <SelectTrigger id="ticketStatus" className="!h-11"><SelectValue placeholder="Select status" /></SelectTrigger>
                        <SelectContent>
                            {TICKET_STATUSES.map((status) => (
                            <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Empty Spacer Column */}
                <div></div>

                <div className="flex justify-end pt-2"> 
                    <Button onClick={() => handleConsumeSearch()} disabled={isConsumeSearching} className="w-full h-11">
                        <Search className="mr-2 h-4 w-4" />
                        {isConsumeSearching ? "Searching..." : "Search"}
                    </Button>
                </div>
                
            </div>
            </CardContent>
        </Card>
      )}

      {consumeSearchResult && (currentStep === 'selection' ? renderSelectionView() : renderConfirmationView())}
    </>
  )
}