// components/themepark-support/tabs/Ticket/ManualConsumeTab.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Wallet, TrendingUp } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { BalanceCard } from "@/components/themepark-support/it-poswf/balance-card"
import {
  type AvailableTicket,
  type ManualConsumeData,
  type ManualConsumeSearchPayload,
  type ConsumeExecuteItem,
  type ConsumeExecutePayload,
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
  
  const [consumeSearchResult, setConsumeSearchResult] = useState<ManualConsumeData | null>(null)
  const [isConsumeSearching, setIsConsumeSearching] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [allTerminals, setAllTerminals] = useState<Terminal[]>([]);

  // Determine required states based on consumeType
  const isSuperApp = consumeType === "superapp";
  const isReceipt = consumeType === "receipt";
  const isEmailDisabled = isReceipt;
  const isMobileDisabled = isReceipt;
  const isInvoiceDisabled = isSuperApp;

  // Fetch all terminals on mount
  useEffect(() => {
    const fetchTerminalsList = async () => {
        try {
            const response = await itPoswfService.fetchAllTerminals();
            if (response.success && response.data) {
                setAllTerminals(response.data);
            }
        } catch (error) {
            console.error("Error fetching terminals:", error);
        }
    };
    fetchTerminalsList();
  }, []);

  const handleConsumeSearch = async () => {
    // Basic validation for inputs
    let missingFields: string[] = [];
    if (!consumeType) missingFields.push("Consume Type");
    if (!terminalId) missingFields.push("Terminal ID");
    if (!ticketType) missingFields.push("Ticket Type");
    if (!ticketStatus) missingFields.push("Ticket Status");

    if (isSuperApp && !email.trim()) missingFields.push("Email Address");
    if (isReceipt && !invoiceNo.trim()) missingFields.push("Invoice No");

    if (missingFields.length > 0) {
        toast({
            title: "Input Required",
            description: `Missing: ${missingFields.join(", ")}`,
            variant: "default",
        });
        return;
    }
    
    setIsConsumeSearching(true);
    setConsumeSearchResult(null); // Clear previous results to trigger UI refresh

    const searchPayload: ManualConsumeSearchPayload = {
        searchType: consumeType.toUpperCase(),
        email: email.trim(), 
        mobile: mobileNo.trim(), 
        invoiceNo: invoiceNo.trim(),
        terminalID: terminalId,
        ticketType: ticketType.toUpperCase(),
        ticketStatus: ticketStatus.toUpperCase(),
    };

    try {
        const response = await itPoswfService.searchManualConsume(searchPayload);
        
        console.log("Search Response:", response); // Debug log

        if (response.success && response.data) {
            // 1. Always set the data first so UI shows up
            setConsumeSearchResult(response.data);

            // 2. Check for missing IDs and warn ONLY (don't block display)
            if (isSuperApp && !response.data.accID) {
                 toast({ 
                    title: "Warning: Missing Account ID", 
                    description: "Account ID not returned. Consumption might fail.", 
                    variant: "destructive" 
                });
            } else if (isReceipt && !response.data.rrQRID) {
                toast({ 
                    title: "Warning: Missing QR ID", 
                    description: "QR ID not returned. Consumption might fail.", 
                    variant: "destructive" 
                });
            } else {
                toast({ 
                    title: "Search Complete",
                    description: `Found ${response.data.tickets.length} tickets.`, 
                    variant: "default" 
                });
            }

        } else {
            setConsumeSearchResult(null);
            toast({
                title: "Search Failed",
                description: response.error || "No data found.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Search Exception:", error);
        toast({
            title: "Error",
            description: "An unexpected error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsConsumeSearching(false);
    }
  }

  const handleConsumeExecute = async () => {
    if (!consumeSearchResult || consumeSearchResult.tickets.length === 0) return;

    // Strict validation only at Execution time
    if (isSuperApp && !consumeSearchResult.accID) {
        toast({ title: "Cannot Execute", description: "Missing Account ID (accID).", variant: "destructive" });
        return;
    }
    if (isReceipt && !consumeSearchResult.rrQRID) {
        toast({ title: "Cannot Execute", description: "Missing QR ID (rrQRID).", variant: "destructive" });
        return;
    }

    setIsExecuting(true);
    
    try {
        const itemsToConsume = consumeSearchResult.tickets;
        const mappedItems: ConsumeExecuteItem[] = itemsToConsume.map(item => ({
            itemID: item.TicketItemID || 1, 
            quantity: 1, 
            unitPrice: item.ItemPoint, 
            amtBeforeTax: item.ItemPoint,
            amount: item.ItemPoint,
        }));

        const numericTerminalId = Number(terminalId.split('-').pop() || terminalId) || 474; 
        const totalAmount = mappedItems.reduce((sum, item) => sum + item.amount, 0);

        const executePayload: ConsumeExecutePayload = {
            consumeBySuperApp: isSuperApp,
            accID: consumeSearchResult.accID ?? 0,
            rrQRID: consumeSearchResult.rrQRID ?? "",
            terminalID: numericTerminalId, 
            totalAmount: totalAmount,
            items: mappedItems,
            custEmail: email.trim(),
            txtMobileNo: mobileNo.trim() || "",
            creditBalance: consumeSearchResult.creditBalance,
            itemNamesForEmail: itemsToConsume.map(i => i.ItemName).join(', '), 
        };
        
        const response = await itPoswfService.executeManualConsume(executePayload);
        
        if (response.success) {
            setConsumeSearchResult(null);
            if(isSuperApp) setEmail("");
            if(isReceipt) setInvoiceNo("");
            toast({ title: "Success", description: `Consumption Successful. Invoice: ${response.data?.invoiceNo || 'N/A'}` });
        } else {
            throw new Error(response.error || "Consumption failed.");
        }
    } catch (error) {
        toast({ title: "Failed", description: error instanceof Error ? error.message : "Error executing consumption.", variant: "destructive" });
    } finally {
        setIsExecuting(false);
    }
  }

  const ticketColumns: TableColumn<AvailableTicket>[] = [
    { header: "Package Name", accessor: "PackageName", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Item Name", accessor: "ItemName" },
    { header: "Consume Terminal", accessor: "ConsumeTerminal" },
    { header: "Item Type", accessor: "TicketType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Item Points", accessor: "ItemPoint", cell: (value) => value.toLocaleString() },
    { header: "Package Status", accessor: "PackageStatus", cell: (value) => <StatusBadge status={value} /> },
  ]
  
  const displayTotalAmount = consumeSearchResult?.tickets.reduce((sum, item) => sum + (item.ItemPoint ?? 0), 0) ?? 0;

  return (
    <>
      <Card className="mb-6">
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label>Consume Type</Label>
              <Select value={consumeType} onValueChange={setConsumeType}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="superapp">By Superapp</SelectItem>
                  <SelectItem value="receipt">By Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Email Address <span className="text-muted-foreground">{isSuperApp ? "(Required)" : "(Disabled)"}</span></Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEmailDisabled} className="h-11" placeholder="Enter email" />
            </div>

            <div className="space-y-2">
              <Label>Mobile No <span className="text-muted-foreground">{isSuperApp ? "(Optional)" : "(Disabled)"}</span></Label>
              <Input value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} disabled={isMobileDisabled} className="h-11" placeholder="Enter mobile" />
            </div>

            <div className="space-y-2">
              <Label>Invoice No <span className="text-muted-foreground">{isReceipt ? "(Required)" : "(Disabled)"}</span></Label>
              <Input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} disabled={isInvoiceDisabled} className="h-11" placeholder="Enter invoice" />
            </div>

            <div className="space-y-2">
              <Label>Terminal ID</Label>
              <Select value={terminalId} onValueChange={setTerminalId}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select terminal" /></SelectTrigger>
                <SelectContent>
                  {allTerminals.map((t) => <SelectItem key={t.id} value={t.id}>{`${t.terminalName} (${t.id})`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ticket Type</Label>
              <Select value={ticketType} onValueChange={setTicketType}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ticket">Ticket</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="reward">Reward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ticket Status</Label>
              <Select value={ticketStatus} onValueChange={setTicketStatus}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="unused">Unused</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end md:col-span-2 lg:col-span-3">
              <Button onClick={handleConsumeSearch} disabled={isConsumeSearching} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isConsumeSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Results if available */}
      {consumeSearchResult && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-1">
            <BalanceCard
              title="Credit Balance"
              amount={consumeSearchResult.creditBalance}
              description="Available balance for consumption"
              icon={Wallet}
              valueColor="text-green-600"
            />
          </div>

          <Card>
            <CardContent className="space-y-4">
              <div className="text-sm font-medium">Available Tickets</div>
              <DataTable
                columns={ticketColumns}
                data={consumeSearchResult.tickets}
                keyExtractor={(row) => row.id} // Ensure 'id' exists on AvailableTicket
                emptyMessage="No available tickets found"
              />
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Consumable iPoints</span>
                  </div>
                  <span className="text-lg font-semibold">{displayTotalAmount.toLocaleString()} iPoints</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Reward Credit</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">{consumeSearchResult.totalRewardCredit.toLocaleString()} Credits</span>
                </div>
                <Button onClick={handleConsumeExecute} disabled={isExecuting} className="w-full">
                    {isExecuting ? "Executing..." : "Execute Consumption"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}