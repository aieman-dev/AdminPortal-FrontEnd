// components/themepark-support/tabs/Transaction/RetailManualConsumeTab.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { EmailAutocomplete } from "@/components/ui/email-autocomplete"
import { ReceiptView, ReceiptData } from "@/components/modules/themepark-support/Receipt/ReceiptView"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Wallet, TrendingUp, Minus, Plus, ShoppingCart, XCircle, ArrowLeft, CheckCircle2, SearchX, FlaskConical, Loader2 } from "lucide-react"
import { BalanceCard } from "@/components/shared-components/balance-card"
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import {
  type RetailManualConsumeData,
  type RetailManualConsumeSearchPayload,
  type ConsumeExecutePayload,
  type ConsumeExecuteItem,
  type RetailItem,
} from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useAppToast } from "@/hooks/use-app-toast"
import { TerminalSelector } from "@/components/shared-components/terminal-selector"
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { SimulationWrapper } from "@/components/shared-components/simulation-wrapper"
import { SimulationToggle } from "@/components/shared-components/simulation-toggle"
import { formatCurrency } from "@/lib/formatter"
import { CONSUME_TYPES, TERMINAL_GROUPS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { PaginationControls } from "@/components/ui/pagination-controls" 
import { usePagination } from "@/hooks/use-pagination"

type Step = 'selection' | 'confirmation';

// ============================================================================
// 1. HELPERS & PURE FUNCTIONS
// ============================================================================

const simulateTransaction = (balance: number, cost: number) => {
    return {
        success: true,
        newBalance: balance - cost,
        isAllowed: balance >= cost,
        message: balance >= cost 
            ? "Simulation: Transaction would succeed." 
            : "Simulation: Transaction would FAIL (Insufficient Funds)."
    };
};

const getTerminalAcronym = (name: string) => {
    if (!name) return "SIM";
    const cleanName = name.replace(/[^a-zA-Z\s]/g, "").trim();
    const words = cleanName.split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
    return words.map(w => w[0]).join("").toUpperCase();
};

export default function RetailManualConsumeTab() {
  const toast = useAppToast()
  const router = useRouter();

  // ============================================================================
  // 2. STATE MANAGEMENT
  // ============================================================================
  
  const [currentStep, setCurrentStep] = useState<Step>('selection');

  // Search Form State
  const [consumeType, setConsumeType] = useState<string>("superapp")
  const [email, setEmail] = useState("")
  const [mobileNo, setMobileNo] = useState("")
  const [invoiceNo, setInvoiceNo] = useState("")
  const [terminalId, setTerminalId] = useState<string>("") 
  const [terminalName, setTerminalName] = useState<string>("")
  const [tGroupId, setTGroupId] = useState<string>("")
  const [itemName, setItemName] = useState<string>("")
  
  // Data State
  const [consumeSearchResult, setConsumeSearchResult] = useState<RetailManualConsumeData | null>(null)
  const [quantities, setQuantities] = useState<Record<string, number>>({}) 
  
  // Loading & Flow State
  const [isBalanceAlertOpen, setIsBalanceAlertOpen] = useState(false);
  const [isConsumeSearching, setIsConsumeSearching] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simulatedReceipt, setSimulatedReceipt] = useState<ReceiptData | null>(null);

  // Pagination State
  const pager = usePagination({ pageSize: 10, mode: "client" });

  // Derived State Flags
  const isSuperApp = consumeType === "superapp";
  const isReceipt = consumeType === "receipt";
  const isEmailDisabled = isReceipt;   
  const isMobileDisabled = isReceipt; 
  const isInvoiceDisabled = isSuperApp;

  // ============================================================================
  // 3. CORE LOGIC & API HANDLERS
  // ============================================================================

  const handleConsumeSearch = async () => {
    let missingFields: string[] = [];
    if (!consumeType) missingFields.push("Consume Type");
    if (!terminalId) missingFields.push("Terminal"); 
    if (!tGroupId) missingFields.push("Terminal Group");

    if (isSuperApp && !email.trim()) missingFields.push("Email");
    if (isReceipt && !invoiceNo.trim()) missingFields.push("Invoice No");

    if (missingFields.length > 0) {
        toast.info("Input Required",`Missing: ${missingFields.join(", ")}`);
        return;
    }
    
    setIsConsumeSearching(true);
    setConsumeSearchResult(null);
    setQuantities({}); 
    pager.reset(); 
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
                 toast.error("Account Data Missing", "Account ID missing.");
                setConsumeSearchResult(null);
                return;
            }
            setConsumeSearchResult(response.data);
            toast.success("Items Loaded", `Found ${response.data.items.length} items.`);
        } else {
            setConsumeSearchResult(null);
            toast.error("Search Failed", response.error || "No items found.");
        }
    } catch (error) {
        console.error("Search Error:", error);
        toast.error("Error", "Search failed.");
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
          toast.info("Cart Empty","Select at least one item.");
          return;
      }
      setCurrentStep('confirmation');
  };

  const handleBackStep = () => {
      setSimResult(null);
      setCurrentStep('selection');
  };

  const closeSimulation = () => {
      setSimulatedReceipt(null);
  }

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

    // --- SIMULATION BRANCH ---
    if (isSimulating) {
        setIsExecuting(true);
        
        const mathResult = simulateTransaction(consumeSearchResult.creditBalance, totalAmount);
        await new Promise(resolve => setTimeout(resolve, 800));

        if (!mathResult.isAllowed) {
            toast.error("Simulation Failed", mathResult.message);
            setIsExecuting(false);
            return;
        }

        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, ""); 
        const randomSequence = Math.floor(10000 + Math.random() * 90000); 
        const prefix = getTerminalAcronym(terminalName);
        const fakeInvoiceNo = `${prefix}-${dateStr}${randomSequence}`;

        const mockReceipt: ReceiptData = {
            invoiceNo: fakeInvoiceNo,
            date: new Date().toISOString(),
            customerName: consumeSearchResult.accID ? "Simulated User" : "Guest Simulator",
            customerEmail: email || "simulation@preview.com",
            status: "Paid", 
            totalAmount: totalAmount,
            items: mappedItems.map(item => {
                const original = consumeSearchResult.items.find(i => i.itemID === item.itemID);
                return {
                    name: original?.itemName || "Unknown Item",
                    qty: item.quantity,
                    amount: item.amount
                };
            })
        };

        setSimulatedReceipt(mockReceipt);
        toast.success("Simulation Success", `Invoice: ${fakeInvoiceNo} (Faked) created.`);
        
        setIsExecuting(false);
        return; 
    }

    // --- LIVE EXECUTION ---
    if (consumeSearchResult.creditBalance < totalAmount) {
         setIsBalanceAlertOpen(true);
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
            const newInvoice = response.data?.invoiceNo;

            const receiptData: ReceiptData = {
                invoiceNo: newInvoice || "N/A",
                date: new Date().toISOString(),
                customerEmail: email || "Walk-in Customer",
                customerName: consumeSearchResult.accID ? "Registered User" : "Guest",
                status: "Consumed",
                totalAmount: totalAmount,
                items: mappedItems.map(item => {
                    const original = consumeSearchResult.items.find(i => i.itemID === item.itemID);
                    return {
                        name: original?.itemName || "Unknown Item",
                        amount: item.amount,
                        qty: item.quantity
                    };
                })
            };

            const encodedData = Buffer.from(JSON.stringify(receiptData)).toString('base64');

            setConsumeSearchResult(null);
            setQuantities({});
            setEmail("");
            setInvoiceNo("");
            setCurrentStep('selection');

            toast.success("Transaction Successful", `Invoice: ${newInvoice} created.`);

            if (newInvoice) {
                  const returnUrl = encodeURIComponent('/portal/themepark-support/transaction-master?tab=retail-manual-consume');
                  router.push(`/portal/themepark-support/receipt?invoiceNo=${newInvoice}&returnTo=${returnUrl}&data=${encodedData}`)
            }
        } else {
            throw new Error(response.error || "Consumption failed.");
        }
    } catch (error) {
        toast.error("Failed", error instanceof Error ? error.message : "Error.");
    } finally {
        setIsExecuting(false);
    }
  }

  useEffect(() => {
    const handleTabRefresh = () => {
        if (terminalId) {
            handleConsumeSearch();
        }
    };

    window.addEventListener('refresh-active-tab', handleTabRefresh);
    return () => window.removeEventListener('refresh-active-tab', handleTabRefresh);
  }, [terminalId, email, invoiceNo, consumeType, tGroupId]);

  // ============================================================================
  // 4. UI CONFIGURATION (Columns & Derived State)
  // ============================================================================

  const cartTotal = useMemo(() => {
      if (!consumeSearchResult) return 0;
      return consumeSearchResult.items.reduce((total, item) => total + (item.unitPrice * (quantities[item.id] || 0)), 0);
  }, [consumeSearchResult, quantities]);

  const paginatedItems = useMemo(() => {
      return pager.paginate(consumeSearchResult?.items || []);
  }, [consumeSearchResult, pager.paginate]);

  const totalPages = consumeSearchResult ? Math.ceil(consumeSearchResult.items.length / pager.pageSize) : 0;

  const retailItemColumns: TableColumn<RetailItem>[] = useMemo(() => [
    { header: "Item Details", accessor: "itemName", className: "pl-6 w-[40%]", cell: (value, row: RetailItem) => (
        <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">{value}</span>
            <div className="flex gap-2 text-xs text-muted-foreground mt-0.5">
                <span>ID: {row.itemID}</span>
                {row.barcode && <><span className="w-px h-3 bg-border"></span><span className="font-mono">Barcode:{row.barcode}</span></>}
            </div>
        </div>
    )},
    { header: "Category", accessor: "categoryCode", cell: (value) => (
        <Badge variant="outline" className="text-[10px] h-5 w-24 justify-center truncate">{value}</Badge>
    )},
    { header: "Unit Price", accessor: "unitPrice", className: "text-right font-medium", cell: (value) => formatCurrency(value) },
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
        return <span className={qty > 0 ? "text-foreground" : "text-muted-foreground/30"}>{formatCurrency(row.unitPrice * qty)}</span>
    }}
  ], [quantities]);

  // ============================================================================
  // 5. SUB-RENDERERS (Keeps the main return clean)
  // ============================================================================

  const renderSelectionView = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 mt-6">
            <div className="grid gap-4 md:grid-cols-2"> 
                <BalanceCard
                    title="Current Credit Balance"
                    amount={consumeSearchResult?.creditBalance || 0}
                    description="Available balance"
                    icon={Wallet}
                    valueColor="text-green-600"
                />
                <div className="hidden md:block"></div> 
            </div>

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
                            skeletonRowCount={pager.pageSize}
                            emptyTitle="No Items Available"
                            emptyMessage="No available retail items found for this selection."
                        />
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="px-6 pb-4">
                            <PaginationControls 
                                currentPage={pager.currentPage}
                                totalPages={totalPages}
                                totalRecords={consumeSearchResult?.items.length}
                                pageSize={pager.pageSize}
                                onPageChange={pager.setCurrentPage}
                            />
                        </div>
                    )}
                
                    {/* Sticky Footer */}
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
                                        {formatCurrency(cartTotal)}
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
                        <span className="text-xl font-bold text-primary">{formatCurrency(creditBalance)}</span>
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
                                                ID: {item.itemID} <span className="mx-1">•</span>{formatCurrency(item.unitPrice * qty)}/unit
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono text-muted-foreground">x {qty}</div>
                                            <div className="font-bold text-foreground">{formatCurrency(cartTotal)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-bold">Total Amount:</span>
                        <span className="text-2xl font-bold text-primary">{formatCurrency(cartTotal)}</span>
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
                        className={isSimulating ? "bg-amber-500 hover:bg-amber-600" : ""}
                    >
                        {isSimulating ? "Run Simulation" : "Confirm Purchase"}
                    </LoadingButton>
                </CardFooter>
            </Card>
        </div>
      );
  };

  const renderSimulationReceiptView = () => (
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase tracking-wide">Simulation Mode</span>
                      <span className="text-xs opacity-90">This receipt is a generated preview. No data was saved.</span>
                  </div>
              </div>
              <Button size="sm" onClick={closeSimulation} className="bg-amber-600 hover:bg-amber-700 text-white border-none shadow-none">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Edit / Back
              </Button>
          </div>

          <div className="relative pointer-events-none select-none">
               <div className="absolute inset-0 z-50 flex items-center justify-center opacity-[0.08] pointer-events-none overflow-hidden">
                    <div className="transform -rotate-45 text-9xl font-black text-slate-900 whitespace-nowrap">
                        SIMULATION
                    </div>
               </div>
               {simulatedReceipt && <ReceiptView data={simulatedReceipt} onBack={closeSimulation} />}
          </div>
      </div>
  );

  // ============================================================================
  // 6. MAIN RENDER
  // ============================================================================

  if (simulatedReceipt) {
      return renderSimulationReceiptView();
  }

  return (
    <>
      <div className="w-full relative z-20 mb-4 md:mb-0 md:h-0">
         <div className="w-full md:w-auto md:absolute right-0 md:-top-[60px]">
             <SimulationToggle isSimulating={isSimulating} onToggle={(val) => { 
                 setIsSimulating(val); 
                 setSimResult(null); 
             }} />
          </div>
      </div>

      <SimulationWrapper isSimulating={isSimulating}>
        {/* Search Form */}
        {currentStep === 'selection' && (
            <Card className={cn(isSimulating && "border-amber-200 shadow-none bg-transparent")}>
                <CardContent>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 items-end">
                        <div className="space-y-2">
                            <Label htmlFor="consumeType">Consume Type</Label>
                            <Select value={consumeType} onValueChange={setConsumeType}>
                                <SelectTrigger id="consumeType" className="!h-11"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {CONSUME_TYPES.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address {isSuperApp && "*"}</Label>
                            <EmailAutocomplete 
                                id="email" 
                                className="h-11" 
                                value={email} onChange={(e) => setEmail(e.target.value)} 
                                disabled={isEmailDisabled} 
                                placeholder="customer@email.com"/>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="mobileNo">Mobile No</Label>
                        <Input id="mobileNo" className="h-11" value={mobileNo} onChange={(e) => setMobileNo(e.target.value)} disabled={isMobileDisabled} />
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNo">Invoice No {isReceipt && "*"}</Label>
                            <Input id="invoiceNo" 
                             value={invoiceNo} 
                             onChange={(e) => setInvoiceNo(e.target.value)} 
                             disabled={isInvoiceDisabled}
                            className={cn("h-11", isSimulating && "bg-white/80 dark:bg-black/50 border-amber-200 focus-visible:ring-amber-400")}
                            />
                        </div>

                        <div className="space-y-2 col-span-1">
                            <TerminalSelector 
                                value={terminalId} 
                                onChange={setTerminalId} 
                                onTerminalSelect={(t) => setTerminalName(t.terminalName)}
                                label="Terminal Search & Select *" 
                                className="h-11"/>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="tGroupId">Terminal Group ID</Label>
                            <Select value={tGroupId} onValueChange={setTGroupId}>
                                <SelectTrigger id="tGroupId" className="!h-11"><SelectValue placeholder="Select Group" /></SelectTrigger>
                                <SelectContent>
                                    {TERMINAL_GROUPS.map((group) => (
                                        <SelectItem key={group.value} value={group.value}>{group.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="itemName">Item Name (Search)</Label>
                            <Input id="itemName" className="h-11" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="e.g. Burger" />
                        </div>

                        <div></div>
                        
                        <div className="flex justify-end pt-2">
                            <Button onClick={handleConsumeSearch} 
                            disabled={isConsumeSearching} 
                            className={cn(
                                        "w-full h-11 transition-colors",
                                        isSimulating ? "bg-amber-500 hover:bg-amber-600 text-white" : ""
                                    )}
                                >
                                    {isConsumeSearching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                                    {isConsumeSearching ? "Simulating Search..." : "Search Items"}
                            </Button>
                        </div>
                     </div>
                </CardContent>
            </Card>
        )}

        {/* Step Rendering */}
        {consumeSearchResult && (currentStep === 'selection' ? renderSelectionView() : renderConfirmationView())}
            
      </SimulationWrapper>

      {/* Insufficient Balance Alert */}
      <AlertDialog open={isBalanceAlertOpen} onOpenChange={setIsBalanceAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-red-600 mb-2">
                        <XCircle className="h-6 w-6" />
                        <AlertDialogTitle>Insufficient Balance</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        The user's credit balance is <strong>{formatCurrency(consumeSearchResult?.creditBalance)}</strong>, 
                        but the total cart amount is <strong>{formatCurrency(cartTotal)}</strong>.
                        <br/><br/>
                        Please ask the user to top up or reduce the cart items.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setIsBalanceAlertOpen(false)}>Okay, understood</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}