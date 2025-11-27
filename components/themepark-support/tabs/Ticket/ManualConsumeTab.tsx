// components/it-poswf/tabs/Ticket/ManualConsumeTab.tsx
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


  // Fetch all terminals on mount for the Manual Consume dropdown
  useEffect(() => {
    const fetchTerminalsList = async () => {
        try {
            const response = await itPoswfService.fetchAllTerminals();
            if (response.success && response.data) {
                setAllTerminals(response.data);
            } else {
                console.error("Failed to fetch terminal list:", response.error);
                toast({ title: "Error", description: "Failed to load terminal dropdown list.", variant: "destructive" });
            }
        } catch (error) {
            console.error("Network error fetching terminals:", error);
        }
    };
    fetchTerminalsList();
  }, []);

  const handleConsumeSearch = async () => {
    // Basic validation based on previous file's structure
    if (!consumeType || !email || !invoiceNo || !terminalId || !ticketType || !ticketStatus) {
        toast({
            title: "Input Required",
            description: "Please fill in all required search criteria.",
            variant: "default",
        });
        return;
    }
    
    setIsConsumeSearching(true);
    setConsumeSearchResult(null);

    const searchPayload: ManualConsumeSearchPayload = {
        searchType: consumeType.toUpperCase(),
        email: email.trim(),
        mobile: mobileNo.trim() || "", 
        invoiceNo: invoiceNo.trim() || "",
        terminalID: terminalId,
        ticketType: ticketType.toUpperCase(),
        ticketStatus: ticketStatus.toUpperCase(),
    };

    try {
        const response = await itPoswfService.searchManualConsume(searchPayload);

        if (response.success && response.data) {
            setConsumeSearchResult(response.data);
            toast({ title: "Search Complete", description: "Manual consume details retrieved." });
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
        if (!consumeSearchResult || consumeSearchResult.tickets.length === 0) {
            toast({ title: "Action Blocked", description: "No available tickets to consume.", variant: "default" });
            return;
        }
        
        const itemsToConsume = consumeSearchResult.tickets;
        
        const mappedItems: ConsumeExecuteItem[] = itemsToConsume.map(item => {
            const unitPrice = item.ItemPoint; 
            return {
                itemID: item.TicketItemID || 1, 
                quantity: 1, 
                unitPrice: unitPrice, 
                amtBeforeTax: unitPrice,
                amount: unitPrice,
            };
        });

        const MOCK_ACC_ID = 1; 
        const MOCK_RRQRID = "1825076"; 
        const numericTerminalId = Number(terminalId.split('-').pop() || terminalId) || 474; 
        const totalAmount = mappedItems.reduce((sum, item) => sum + item.amount, 0);

        setIsExecuting(true);
        
        const executePayload: ConsumeExecutePayload = {
            consumeBySuperApp: consumeType === "superapp",
            accID: MOCK_ACC_ID,
            rrQRID: MOCK_RRQRID,
            terminalID: numericTerminalId, 
            totalAmount: totalAmount,
            items: mappedItems,
            custEmail: email.trim(),
            txtMobileNo: mobileNo.trim() || "+60103921432",
            creditBalance: consumeSearchResult.creditBalance,
            itemNamesForEmail: itemsToConsume.map(i => i.ItemName).join(', '), 
        };
        
        try {
            const response = await itPoswfService.executeManualConsume(executePayload);
            
            if (response.success) {
                setConsumeSearchResult(null);
                setEmail("");
                setInvoiceNo("");
                toast({ 
                    title: "Consumption Success", 
                    description: `Consumption executed successfully. New Invoice: ${response.data?.invoiceNo || 'N/A'}`,
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
    { header: "Consume Terminal", accessor: "ConsumeTerminal" },
    { header: "Item Type", accessor: "TicketType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Item Points", accessor: "ItemPoint", cell: (value) => value.toLocaleString() },
    { header: "Package Status", accessor: "PackageStatus", cell: (value) => <StatusBadge status={value} /> },
  ]
  
  const displayTotalAmount = consumeSearchResult?.tickets.reduce(
      (sum, item) => sum + (item.ItemPoint ?? 0), 0
  ) ?? 0;

  return (
    <>
      <Card>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mobileNo" className="text-sm font-medium">
                Mobile No <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="mobileNo"
                type="tel"
                placeholder="Enter mobile number"
                value={mobileNo}
                onChange={(e) => setMobileNo(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceNo" className="text-sm font-medium">
                Invoice No
              </Label>
              <Input
                id="invoiceNo"
                placeholder="Enter invoice number"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="terminalId" className="text-sm font-medium">
                Terminal ID
              </Label>
              <Select value={terminalId} onValueChange={setTerminalId}>
                <SelectTrigger id="terminalId" className="h-11">
                  <SelectValue placeholder="Select terminal" />
                </SelectTrigger>
                <SelectContent>
                  {allTerminals.map((terminal) => (
                    <SelectItem key={terminal.id} value={terminal.id}>
                      {`${terminal.terminalName} (${terminal.id})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

            <div className="flex items-end md:col-span-2 lg:col-span-3">
              <Button onClick={handleConsumeSearch} disabled={isConsumeSearching} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isConsumeSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {consumeSearchResult && (
        <>
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
                keyExtractor={(row) => row.id}
                emptyMessage="No available tickets found"
              />
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Consumable iPoints</span>
                  </div>
                  <span className="text-lg font-semibold">
                    {displayTotalAmount.toLocaleString()} iPoints
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Reward Credit</span>
                  </div>
                  <span className="text-lg font-semibold text-green-600">
                    {consumeSearchResult.totalRewardCredit.toLocaleString()} Credits
                  </span>
                </div>
                <Button onClick={handleConsumeExecute} disabled={isExecuting} className="w-full">
                    {isExecuting ? "Executing..." : "Execute Consumption"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}