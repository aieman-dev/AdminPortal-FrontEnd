"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Wallet, TrendingUp, Minus, Plus, ShoppingCart, Loader2, ArrowLeft, CheckCircle2, SearchX } from "lucide-react"
import { BalanceCard } from "@/components/themepark-support/it-poswf/balance-card"
import {
  type RetailManualConsumeData,
  type RetailManualConsumeSearchPayload,
  type ConsumeExecutePayload,
  type ConsumeExecuteItem,
  type RetailItem,
} from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"
import { TerminalSelector } from "@/components/themepark-support/it-poswf/terminal-selector"
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { formatCurrency } from "@/lib/formatter"
import { PaginationControls } from "@/components/ui/pagination-controls" // Import Pagination

type Step = 'selection' | 'confirmation';

export default function RetailManualConsumeTab() {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<Step>('selection');

  // Search State
  const [consumeType, setConsumeType] = useState<string>("superapp")
  const [email, setEmail] = useState("")
  const [mobileNo, setMobileNo] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [terminalId, setTerminalId] = useState<string>("") 
  const [tGroupId, setTGroupId] = useState<string>("")
  const [itemName, setItemName] = useState<string>("")
  
  // Data State
  const [consumeSearchResult, setConsumeSearchResult] = useState<RetailManualConsumeData | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({}) 
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isConsumeSearching, setIsConsumeSearching] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Logic
  const isSuperApp = consumeType === "superapp";
  const isReceipt = consumeType === "receipt";
  const isEmailDisabled = isReceipt;   
  const isMobileDisabled = isReceipt; 
  const isInvoiceDisabled = isSuperApp;

  // --- Search Logic ---
  const handleConsumeSearch = async () => {
    let missingFields: string[] = [];
    if (!consumeType) missingFields.push("Consume Type");
    if (!terminalId) missingFields.push("Terminal"); 
    if (!tGroupId) missingFields.push("Terminal Group");

    if (isSuperApp && !email.trim()) missingFields.push("Email");
    if (isReceipt && !invoiceNo.trim()) missingFields.push("Invoice No");

    if (missingFields.length > 0) {
        toast({ title: "Input Required", description: `Missing: ${missingFields.join(", ")}`, variant: "default" });
        return;
    }
    
    setIsConsumeSearching(true);
    setConsumeSearchResult(null);
    setQuantities({}); 
    setCurrentPage(1); 
    setCurrentStep('selection');

    const searchPayload: RetailManualConsumeSearchPayload = {
        searchType: consumeType.toUpperCase(),
        email: email.trim(), 
        mobile: mobileNo.trim(), 
        invoiceNo: invoiceNo.trim(),
        terminalID: terminalId,
        tGroupID: Number(tGroupId),
        itemName: itemName.trim(), 
    };
    
    try {
        const response = await itPoswfService.searchManualConsumeRetail(searchPayload);

        if (response.success && response.data) {
            if (response.data.items.length === 0) {
                 setConsumeSearchResult(response.data); 
                 return;
            }
            if (isSuperApp && !response.data.accID) {
                 toast({ title: "Account Data Missing", description: "Account ID missing.", variant: "destructive" });
                setConsumeSearchResult(null);
                return;
            }
            setConsumeSearchResult(response.data);
            toast({ title: "Items Loaded", description: `Found ${response.data.items.length} items.` });
        } else {
            setConsumeSearchResult(null);
            toast({ title: "Search Failed", description: response.error || "No items found.", variant: "destructive" });
        }
    } catch (error) {
        console.error("Search Error:", error);
        toast({ title: "Error", description: "Search failed.", variant: "destructive" });
    } finally {
        setIsConsumeSearching(false);
    }
  }

  const updateQuantity = (itemId: string, val: number) => {
      setQuantities(prev => {
          const updated = Math.max(0, val);
          const newMap = { ...prev, [itemId]: updated };
          if (updated === 0) delete newMap[itemId]; 
          return newMap;
      });
  };

  const handleNextStep = () => {
      const totalSelected = Object.values(quantities).reduce((a, b) => a + b, 0);
      if (totalSelected === 0) {
          toast({ title: "Cart Empty", description: "Select at least one item.", variant: "default" });
          return;
      }
      setCurrentStep('confirmation');
  };

  const handleBackStep = () => setCurrentStep('selection');

  const handleConsumeExecute = async () => {
    if (!consumeSearchResult) return;
    const selectedItems = consumeSearchResult.items.filter(item => (quantities[item.id] || 0) > 0);

    const mappedItems: ConsumeExecuteItem[] = selectedItems.map(item => {
        const qty = quantities[item.id]; 
        return {
            itemID: item.itemID, 
            quantity: qty, 
            unitPrice: item.unitPrice, 
            amtBeforeTax: item.unitPrice, 
            amount: item.unitPrice * qty, 
        };
    });

    const totalAmount = mappedItems.reduce((sum, item) => sum + item.amount, 0);

    if (consumeSearchResult.creditBalance < totalAmount) {
         toast({ title: "Insufficient Balance", description: "Credit balance too low.", variant: "destructive" });
        return;
    }

    const numericTerminalId = Number(terminalId.split('-').pop() || terminalId) || 0; 
    setIsExecuting(true);

    const executePayload: ConsumeExecutePayload = {
        consumeBySuperApp: isSuperApp,
        accID: consumeSearchResult.accID || null,
        rQrId: consumeSearchResult.rQrId || null, 
        terminalID: numericTerminalId, 
        totalAmount: totalAmount,
        items: mappedItems,
        custEmail: email.trim(),
        txtMobileNo: mobileNo.trim() || "",
        creditBalance: consumeSearchResult.creditBalance,
        itemNamesForEmail: selectedItems.map(i => i.itemName).join(', '),
    };
    
    try {
        const response = await itPoswfService.executeManualConsumeRetail(executePayload);
        if (response.success) {
            setConsumeSearchResult(null);
            setQuantities({});
            setEmail("");
            setInvoiceNo("");
            setCurrentStep('selection');
            toast({ title: "Success", description: `Invoice: ${response.data?.invoiceNo}`, variant: "default" });
        } else {
            throw new Error(response.error || "Consumption failed.");
        }
    } catch (error) {
        toast({ title: "Failed", description: error instanceof Error ? error.message : "Error.", variant: "destructive" });
    } finally {
        setIsExecuting(false);
    }
  }

  const cartTotal = useMemo(() => {
      if (!consumeSearchResult) return 0;
      return consumeSearchResult.items.reduce((total, item) => total + (item.unitPrice * (quantities[item.id] || 0)), 0);
  }, [consumeSearchResult, quantities]);

  const paginatedItems = useMemo(() => {
      if (!consumeSearchResult) return [];
      const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
      return consumeSearchResult.items.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [consumeSearchResult, currentPage]);

  const totalPages = consumeSearchResult ? Math.ceil(consumeSearchResult.items.length / ITEMS_PER_PAGE) : 0;

  const retailItemColumns: TableColumn<RetailItem>[] = [
    { header: "Item Details", accessor: "itemName", className: "pl-6 w-[40%]", cell: (value: any, row: RetailItem) => (
        <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{value}</span>
            <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                <span>ID: {row.itemID}</span>
                {row.barcode && <><span className="w-px h-3 bg-border"></span><span className="font-mono">Barcode:{row.barcode}</span></>}
            </div>
        </div>
    )},
    { header: "Category", accessor: "categoryCode", cell: (value: any) => (
        <Badge variant="outline" className="text-[10px] h-5 w-24 justify-center truncate">{value}</Badge>
    )},
    { header: "Unit Price", accessor: "unitPrice", className: "text-right font-medium", cell: (value: any) => formatCurrency(value) },
    { header: "Quantity", accessor: "id", className: "text-center", cell: (_: any, row: RetailItem) => {
        const qty = quantities[row.id] || 0;
        return (
            <div className="flex items-center justify-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-l-md border-r-0" onClick={() => updateQuantity(row.id, qty - 1)} disabled={qty === 0}>
                    <Minus className="h-3 w-3" />
                </Button>
                <Input 
                    type="number" 
                    className="h-7 w-12 text-center rounded-none border-x-0 focus-visible:ring-0 px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={qty.toString()}
                    onChange={(e) => updateQuantity(row.id, parseInt(e.target.value) || 0)}
                />
                <Button variant="outline" size="icon" className="h-7 w-7 rounded-r-md border-l-0" onClick={() => updateQuantity(row.id, qty + 1)}>
                    <Plus className="h-3 w-3" />
                </Button>
            </div>
        )
    }},
    { header: "Line Total", accessor: "id", className: "text-right pr-6 font-bold", cell: (_: any, row: RetailItem) => {
        const qty = quantities[row.id] || 0;
        return <span className={qty > 0 ? "text-foreground" : "text-muted-foreground/30"}>RM {(row.unitPrice * qty).toFixed(2)}</span>
    }}
  ];

  // --- REFACTORED VIEW: SELECTION TABLE (Matches ManualConsumeTab) ---
  const renderSelectionView = () => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 mt-6">
            <div className="grid gap-4 md:grid-cols-2"> {/* Changed to 2 columns to match other tab structure even if 2nd is optional */}
                <BalanceCard
                    title="Current Credit Balance"
                    amount={consumeSearchResult?.creditBalance || 0}
                    description="Available balance"
                    icon={Wallet}
                    valueColor="text-green-600"
                />
                {/* Optional: Add a 'Retail Summary' card here later if needed to fill the gap */}
                <div className="hidden md:block"></div> 
            </div>

            {/* FLUSH CARD DESIGN (p-0) */}
            <Card>
                <CardContent className="p-0 overflow-hidden">
                    <div className="bg-muted/40 px-6 py-3 border-b flex justify-between items-center">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Available Retail Items
                        </h3>
                        <span className="text-xs text-muted-foreground">
                            {consumeSearchResult?.items.length} results found
                        </span>
                    </div>

                    <div className="p-0">
                        <DataTable
                            columns={retailItemColumns}
                            data={paginatedItems}
                            keyExtractor={(row) => row.id}
                            isLoading={isConsumeSearching}
                            emptyIcon={SearchX}
                            emptyTitle="No Items Available"
                            emptyMessage="No available retail items found for this selection."
                        />
                    </div>
                    
                    {/* Pagination - Added inside the flush card */}
                    {totalPages > 1 && (
                        <div className="px-6 pb-4">
                            <PaginationControls 
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalRecords={consumeSearchResult?.items.length}
                                pageSize={ITEMS_PER_PAGE}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                
                    {/* Sticky Footer - Edge to Edge */}
                    <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t p-6 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-sm text-muted-foreground">
                                Items selected: {Object.values(quantities).reduce((a, b) => a + b, 0)}
                            </div>
                            
                            <div className="flex items-center gap-6 w-full md:w-auto">
                                <div className="flex flex-col items-end">
                                    <span className="text-sm text-muted-foreground">Total Payable Amount</span>
                                    <div className="flex items-center gap-2 text-2xl font-bold text-primary">
                                        <TrendingUp className="h-5 w-5" />
                                        RM {cartTotal.toFixed(2)}
                                    </div>
                                </div>
                                
                                <Button 
                                    onClick={handleNextStep} 
                                    disabled={cartTotal === 0} 
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

  const renderConfirmationView = () => {
      const selectedItems = consumeSearchResult?.items.filter(item => (quantities[item.id] || 0) > 0) || [];
      const creditBalance = consumeSearchResult?.creditBalance || 0;

      return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300 mt-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                        Confirmation
                    </CardTitle>
                    <CardDescription>Please review the details below before submitting.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-between items-center bg-muted/50 p-4 rounded-lg border">
                        <span className="text-sm font-medium text-muted-foreground">Credit Balance</span>
                        <span className="text-xl font-bold text-primary">RM {creditBalance.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Order Summary:</h4>
                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3">
                            {selectedItems.map(item => {
                                const qty = quantities[item.id];
                                return (
                                    <div key={item.id} className="flex justify-between items-start text-sm border-b border-dashed pb-3 last:border-0 last:pb-0">
                                        <div className="space-y-1">
                                            <div className="font-semibold text-foreground">{item.itemName}</div>
                                            <div className="text-muted-foreground text-xs">
                                                ID: {item.itemID} <span className="mx-1">•</span> RM {item.unitPrice.toFixed(2)}/unit
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-muted-foreground">x {qty}</div>
                                            <div className="font-bold text-foreground">RM {(item.unitPrice * qty).toFixed(2)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold">Total Amount:</span>
                        <span className="text-2xl font-bold text-primary">RM {cartTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between bg-muted/10 p-6">
                    <Button variant="outline" onClick={handleBackStep} disabled={isExecuting}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <Button onClick={handleConsumeExecute} disabled={isExecuting} className="min-w-[140px]">
                        {isExecuting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit"}
                    </Button>
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
            {/* Same Search Form logic as before, already correct */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-end">
                <div className="space-y-2">
                    <Label htmlFor="consumeType">Consume Type</Label>
                    <Select value={consumeType} onValueChange={setConsumeType}>
                        <SelectTrigger id="consumeType" className="!h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="superapp">By Superapp</SelectItem>
                            <SelectItem value="receipt">By Receipt</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email Address {isSuperApp && "*"}</Label>
                    <Input id="email" className="h-11" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEmailDisabled} placeholder="customer@email.com"/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="mobileNo">Mobile No</Label>
                   <Input id="mobileNo" className="h-11" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} disabled={isMobileDisabled} />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="invoiceNo">Invoice No {isReceipt && "*"}</Label>
                    <Input id="invoiceNo" className="h-11" value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} disabled={isInvoiceDisabled} />
                </div>

                 <div className="space-y-2 col-span-1">
                     <TerminalSelector value={terminalId} onChange={setTerminalId} label="Terminal Search & Select *" className="h-11"/>
                </div>
                
                <div className="space-y-2">
                     <Label htmlFor="tGroupId">Terminal Group ID</Label>
                     <Select value={tGroupId} onValueChange={setTGroupId}>
                         <SelectTrigger id="tGroupId" className="!h-11"><SelectValue placeholder="Select Group" /></SelectTrigger>
                         <SelectContent>
                             <SelectItem value="1">1 (I-City)</SelectItem>
                             <SelectItem value="2">2 (JV Partner)</SelectItem>
                             <SelectItem value="3">3 (Photo Booth)</SelectItem>
                         </SelectContent>
                     </Select>
                </div>

                <div className="space-y-2">
                     <Label htmlFor="itemName">Item Name (Search)</Label>
                     <Input id="itemName" className="h-11" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Burger" />
                </div>

                <div></div>
                
                <div className="flex justify-end pt-2">
                    <Button onClick={handleConsumeSearch} disabled={isConsumeSearching} className="w-full h-11">
                         <Search className="mr-2 h-4 w-4" />
                         {isConsumeSearching ? "Searching..." : "Search Items"}
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