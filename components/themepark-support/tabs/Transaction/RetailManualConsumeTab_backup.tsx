// components/themepark-support/tabs/Transaction/RetailManualConsumeTab_backup.tsx
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Wallet, TrendingUp } from "lucide-react"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { BalanceCard } from "@/components/themepark-support/it-poswf/balance-card"
import {
  type RetailItem,
  type RetailManualConsumeData,
  type RetailManualConsumeSearchPayload,
  type ConsumeExecuteItem,
  type ConsumeExecutePayload,
  type Terminal,
} from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"


export default function RetailManualConsumeTab() {
  const { toast } = useToast()

  const [consumeType, setConsumeType] = useState<string>("")
  const [email, setEmail] = useState("")
  const [mobileNo, setMobileNo] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  
  const [terminalId, setTerminalId] = useState<string>("") // Selected Terminal ID
  const [tGroupId, setTGroupId] = useState<string>("")
  const [itemName, setItemName] = useState<string>("")
  
  // NEW STATES FOR SEARCHABLE TERMINAL
  const [terminalSearchQuery, setTerminalSearchQuery] = useState("") 
  const [filteredTerminals, setFilteredTerminals] = useState<Terminal[]>([]) 
  const [isTerminalLoading, setIsTerminalLoading] = useState(false)
  // --- END NEW STATES ---
  
  const [consumeSearchResult, setConsumeSearchResult] = useState<RetailManualConsumeData | null>(null)
  const [isConsumeSearching, setIsConsumeSearching] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)


  // Determine required states based on consumeType
  const isSuperApp = consumeType === "superapp";
  const isReceipt = consumeType === "receipt";
  const isEmailDisabled = isReceipt;
  const isMobileDisabled = isReceipt;
  const isInvoiceDisabled = isSuperApp;
  

  // --- MODIFIED EFFECT: Fetch terminals based on search query with DEBOUNCE ---
  useEffect(() => {
    const fetchFilteredTerminals = async () => {
        // Only trigger search if the query is non-empty or if the list is currently empty.
        
        setIsTerminalLoading(true);
        // Clear selected terminal when search starts (unless the query is empty on initial load)
        if (terminalSearchQuery.length > 0 && terminalId) {
             setTerminalId(""); 
        }
        
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


  const handleConsumeSearch = async () => {
    let missingFields: string[] = [];

    if (!consumeType) missingFields.push("Consume Type");
    
    // UPDATED VALIDATION: Check for Terminal selection
    if (!terminalId) missingFields.push("Terminal ID"); 

    if (!tGroupId) missingFields.push("Terminal Group ID");
    if (!itemName.trim()) missingFields.push("Item Name");
    // ... (rest of validation unchanged) ...

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

    const searchPayload: RetailManualConsumeSearchPayload = {
        searchType: consumeType === "superapp" ? "SuperApp" : "Receipt",
        email: email.trim(), 
        mobile: mobileNo.trim(), 
        invoiceNo: invoiceNo.trim(),
        terminalID: terminalId, // Use the selected ID
        tGroupID: Number(tGroupId),
        itemName: itemName.trim(), 
    };
    
    try {
        const response = await itPoswfService.searchManualConsumeRetail(searchPayload);

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
            if (!response.data.rQrId) {
                toast({ 
                    title: "System Data Missing", 
                    description: "Search successful, but QR ID (rrQRID) is missing for execution.", 
                    variant: "destructive" 
                });
            }

            setConsumeSearchResult(response.data);
            toast({ 
                title: "Search Complete",
                 description: `Found ${response.data.items.length} retail items.`, 
                 variant: "default" });

        } else {
            setConsumeSearchResult(null);
            toast({
                title: "Search Failed",
                description: response.error || "No retail items found matching the search criteria.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("Retail Manual Consume Search Error:", error);
        if (error instanceof Error && error.message.includes("Network")) {
             toast({
                title: "Network Error",
                description: "Failed to connect to the search service.",
                variant: "destructive"
            });
        } else {
             toast({
                title: "Error",
                description: "An unexpected error occurred during search.",
                variant: "destructive"
            });
        }
    } finally {
        setIsConsumeSearching(false);
    }
  }

  const handleConsumeExecute = async () => {
    // ... (rest of execute logic remains the same) ...
    if (!consumeSearchResult || consumeSearchResult.items.length === 0) {
        toast({ 
            title: "Action Blocked", 
            description: "No available items to consume.",
             variant: "default" });
        return;
    }

    if (isSuperApp && !consumeSearchResult.accID) {
        toast({ 
            title: "Execution Blocked", 
            description: "Cannot execute: Account ID is required in Superapp mode but is missing.", 
            variant: "destructive" 
        });
        return;
    }

    if (!consumeSearchResult.rQrId) {
        toast({ 
            title: "Execution Blocked", 
            description: "Cannot execute: RRQRID is missing from the search result.", 
            variant: "destructive" 
        });
        return;
    }
    
    const itemsToConsume = consumeSearchResult.items;
    
    // Prepare the items array for the execute payload
    const mappedItems: ConsumeExecuteItem[] = itemsToConsume.map(item => {
        const unitPrice = item.unitPrice; 
        return {
            itemID: item.itemID, 
            quantity: 1, 
            unitPrice: unitPrice, 
            amtBeforeTax: unitPrice, 
            amount: unitPrice,
        };
    });

    const finalAccID = consumeSearchResult.accID || null; 
    const finalRQRID = consumeSearchResult.rQrId ?? ""; 
    const numericTerminalId = Number(terminalId.split('-').pop() || terminalId) || 0; 
    const totalAmount = mappedItems.reduce((sum, item) => sum + item.amount, 0);

    setIsExecuting(true);
    
    const executePayload: ConsumeExecutePayload = {
        consumeBySuperApp: isSuperApp,
        accID: finalAccID,
        rQrId: finalRQRID, 
        terminalID: numericTerminalId, 
        totalAmount: totalAmount,
        items: mappedItems,
        custEmail: email.trim(),
        txtMobileNo: mobileNo.trim() || "",
        creditBalance: consumeSearchResult.creditBalance,
        itemNamesForEmail: itemsToConsume.map(i => i.itemName).join(', '), 
    };
    
    try {
        const response = await itPoswfService.executeManualConsumeRetail(executePayload);
        
        if (response.success) {
            setConsumeSearchResult(null);
            setEmail("");
            setInvoiceNo("");
            toast({ 
                title: "Consumption Success", 
                description: `Retail consumption executed successfully. New Invoice: ${response.data?.invoiceNo || 'N/A'}`,
                variant: "default"
            });
        } else {
            throw new Error(response.error || "Consumption failed.");
        }
    } catch (error) {
        console.error("Retail Consume Execute Error:", error);
        toast({
            title: "Consumption Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred during execution.",
            variant: "destructive"
        });
    } finally {
        setIsExecuting(false);
    }
  }


  const retailItemColumns: TableColumn<RetailItem>[] = [
    { header: "Item ID", accessor: "itemID", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Item Name", accessor: "itemName" },
    { header: "Barcode", accessor: "barcode" },
    { header: "Category", accessor: "categoryCode" },
    { header: "Subcategory", accessor: "subcategoryCode" },
    { header: "Unit Price (RM)", accessor: "unitPrice", cell: (value) => `RM ${(value ?? 0).toFixed(2)}` },
  ]
  
  const displayTotalAmount = consumeSearchResult?.items.reduce(
      (sum, item) => sum + (item.unitPrice ?? 0), 0
  ) ?? 0;

  return (
    <>
      <Card>
        <CardContent>
          {/* Using grid-cols-3 for the compact layout */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            
            {/* R1, C1: Consume Type */}
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

            {/* R1, C2: Email Address */}
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

            {/* R1, C3: Mobile No */}
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
            
            {/* R2, C1: Invoice No */}
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

            {/* R2, C2: Terminal Search Input */}
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

            {/* R2, C3: Select Terminal ID */}
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
            
            {/* R3, C1: Item Name */}
            <div className="space-y-2">
              <Label htmlFor="itemName" className="text-sm font-medium">
                Item Name
              </Label>
              <Input
                id="itemName"
                placeholder="Enter item name (e.g., 'Tempura Nuggets')"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className="h-11"
              />
            </div>

            {/* R3, C2: Terminal Group ID */}
            <div className="space-y-2">
              <Label htmlFor="tGroupId" className="text-sm font-medium">
                Terminal Group ID
              </Label>
              <Select value={tGroupId} onValueChange={setTGroupId}>
                <SelectTrigger id="tGroupId" className="h-11">
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 (I-City)</SelectItem>
                  <SelectItem value="2">2 (JV Partner)</SelectItem>
                  <SelectItem value="3">3 (Photo Booth)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* R3, C3: Search Button - Aligned to the far right */}
            <div className="space-y-2 flex flex-col justify-end items-end"> 
              <div className="h-6"></div>
             <Button 
                onClick={handleConsumeSearch} 
                disabled={isConsumeSearching} 
                className="h-11 w-40" 
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
              <div className="text-sm font-medium">Available Retail Items ({consumeSearchResult.items.length})</div>
              
              <div className="overflow-y-auto max-h-[300px] border border-border rounded-lg">
                <DataTable
                  columns={retailItemColumns}
                  data={consumeSearchResult.items}
                  keyExtractor={(row) => row.id}
                  emptyMessage="No available retail items found"
                />
              </div>
              
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Total Item Price</span>
                  </div>
                  <span className="text-lg font-semibold">
                    RM {displayTotalAmount.toFixed(2)}
                  </span>
                </div>
                
                <Button onClick={handleConsumeExecute} disabled={isExecuting} className="w-full">
                    {isExecuting ? "Executing..." : "Execute Retail Consume"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  )
}