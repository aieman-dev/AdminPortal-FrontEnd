"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardHeader,CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { XCircle, Clock, SearchX, FlaskConical, CheckCircle2 } from "lucide-react" 
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { SearchField } from "@/components/shared-components/search-field" 
import { type VoidTransaction } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { formatCurrency, formatDate } from "@/lib/formatter";
import { useAppToast } from "@/hooks/use-app-toast"
import { Badge } from "@/components/ui/badge" 
import { useAutoSearch } from "@/hooks/use-auto-search"
import { SimulationToggle } from "@/components/shared-components/simulation-toggle"
import { SimulationWrapper } from "@/components/shared-components/simulation-wrapper"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"


export default function VoidTransactionTab() {
  const toast = useAppToast()

  const [voidInvoiceNo, setVoidInvoiceNo] = useState("")
  const [voidSearchResult, setVoidSearchResult] = useState<VoidTransaction[]>([])
  const [isVoidSearching, setIsVoidSearching] = useState(false)
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false)
  const [voidingTransaction, setVoidingTransaction] = useState<VoidTransaction | null>(null)
  
  const [isVoiding, setIsVoiding] = useState(false)
  const [confirmText, setConfirmText] = useState("")

  // --- SIMULATION STATE ---
  const [isSimulating, setIsSimulating] = useState(false)
  const [simResult, setSimResult] = useState<{
      id: string, 
      invoice: string, 
      amount: number, 
      timestamp: string 
  } | null>(null)


  const handleVoidSearch = useCallback(async (query: string) => {
    if (!query) return
    
    // Sync input state if triggered via URL
    setVoidInvoiceNo(query);
    setIsVoidSearching(true)
    setVoidSearchResult([])
    setSimResult(null)

    try {
      const response = await itPoswfService.searchVoidTransactions(voidInvoiceNo.trim());

      if (response.success && response.data) {
        setVoidSearchResult(response.data);
        if (response.data.length === 0) {
          toast.info("Search Complete", "No voidable transactions found for this invoice." );
        }
      } else {
        setVoidSearchResult([]);
        toast.error("Search Failed",  response.error || "Could not retrieve transactions.");
      }
    } catch (error) {
      console.error("Void Search Error:", error);
      setVoidSearchResult([]);
      toast.error("Network Error", "Failed to connect to the transaction search service.");
    } finally {
      setIsVoidSearching(false)
    }
  }, [])
  

  useAutoSearch(handleVoidSearch);

  const handleVoidClick = (transaction: VoidTransaction) => {
    setVoidingTransaction(transaction)
    setConfirmText("")
    setIsVoidConfirmOpen(true)
  }

  const handleVoidConfirm = async () => {
    if (!voidingTransaction) return
    setIsVoiding(true)
    
    // --- SIMULATION LOGIC ---
    if (isSimulating) {
        await new Promise(r => setTimeout(r, 800)); 

        // 1. Visually update the table (Local only)
        setVoidSearchResult((prev) => 
            prev.map((t) => (t.trxID === voidingTransaction.trxID ? { ...t, recordStatus: "Voided" } : t))
        )

        // 2. Set Result Card Data
        setSimResult({
            id: voidingTransaction.trxID,
            invoice: voidingTransaction.invoiceNo,
            amount: voidingTransaction.amount,
            timestamp: new Date().toISOString()
        })

        toast.success("Simulation Success", `Transaction ${voidingTransaction.trxID} voided (Preview).`)
        setIsVoidConfirmOpen(false)
        setVoidingTransaction(null)
        setIsVoiding(false)
        return
    }

    // Real API 
    try {
      const payload = {
        trxID: Number(voidingTransaction.trxID), 
        invoiceNo: voidingTransaction.invoiceNo,
        balanceQty: -1, 
        trxType: voidingTransaction.trxType, 
        itemType: voidingTransaction.itemType,
        action: "Void" as const,
      };

      const response = await itPoswfService.executeVoidTransaction(payload);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to communicate with API.");
      }
      
      setVoidSearchResult((prev) => 
        prev.map((t) => (t.terminalID === voidingTransaction.terminalID ? { ...t, recordStatus: "Voided" } : t))
      )
      
      const responseMessage = response.data?.messaged || "Void request processed successfully.";
      toast.success("Success", `Transaction ${voidingTransaction.trxID} voided. ${responseMessage}` )
      logger.info("Executing Void Transaction", { trxId: voidingTransaction.trxID, response: response.data })

    } catch (error) {
      console.error("Void Error:", error);
      toast.error( "Void Failed", error instanceof Error ? error.message : "An unexpected error occurred.");
      logger.error("Void Transaction Failed", { 
          trxId: voidingTransaction?.trxID, 
          error: error instanceof Error ? error.message : error 
      })
    } finally {
      setIsVoidConfirmOpen(false)
      setVoidingTransaction(null)
      setIsVoiding(false)
    }
  }

  //  Listen for the parent's "shout"
  useEffect(() => {
    const handleTabRefresh = () => {
        // Run your search function if there is a value to search for
        if (voidInvoiceNo) {
            handleVoidSearch(voidInvoiceNo);
        }
    };

    window.addEventListener('refresh-active-tab', handleTabRefresh);
    
    return () => window.removeEventListener('refresh-active-tab', handleTabRefresh);
  }, [voidInvoiceNo]);


  const columns: TableColumn<VoidTransaction>[] = useMemo(() => [
    { header: "Transaction ID", accessor: "trxID", cell: (value) => <span className="font-medium">{value}</span> },
    { header: "Invoice No", accessor: "invoiceNo" },
    { header: "Transaction Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Item Type", accessor: "itemType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Balance Qty", accessor: "balanceQty" },
    { header: "Amount", accessor: "amount", cell: (value) => formatCurrency(value) },
    { header: "Terminal", accessor: "terminalID" }, 
    { header: "Status", accessor: "recordStatus", cell: (value) => <StatusBadge status={value} /> },
    { 
        header: "Created Date", 
        accessor: "createdDate",
        cell: (value) => (
            <Badge variant="outline" className="font-normal text-xs text-gray-600 bg-gray-100 border-gray-200 gap-1.5 py-1 px-2.5 w-[160px] justify-center">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                {formatDate(value as string)}
            </Badge>
        )
    },
    {
      header: "Action",
      accessor: "trxID", 
      cell: (_, row) => (
        <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleVoidClick(row)} 
            disabled={row.recordStatus === "Voided"} 
            className={cn(isSimulating && "bg-amber-600 hover:bg-amber-700 text-white")}
        >
          <XCircle className="h-4 w-4 mr-2" /> {isSimulating ? "Simulate Void" : "Void"}
        </Button>
      ),
    },
  ], [isSimulating]);

  return (
    <>
      <div className="space-y-6 pb-12">
        <div className="w-full relative z-20 mb-4 md:mb-0 md:h-0">
            <div className="w-full md:w-auto md:absolute right-0 md:-top-[60px]">
                <SimulationToggle isSimulating={isSimulating} onToggle={(val) => { 
                    setIsSimulating(val); 
                    setSimResult(null);
                    if(!val && voidInvoiceNo) handleVoidSearch(voidInvoiceNo);
                }} />
              </div>
          </div>

        <SimulationWrapper isSimulating={isSimulating}>
            <Card>
              <CardContent>
                <SearchField 
                  label="Invoice Number"
                  placeholder="Enter invoice number"
                  value={voidInvoiceNo}
                  onChange={setVoidInvoiceNo}
                  onSearch={() => handleVoidSearch(voidInvoiceNo)}
                  isSearching={isVoidSearching}
                />
              </CardContent>
            </Card>

            {(isVoidSearching || voidSearchResult.length > 0) && (
              <Card>
                <div className="p-6 border-b">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <XCircle className="h-4 w-4" />
                      Transaction Details
                    </div>
                  </div>
                  <CardContent className="p-0">
                    <DataTable
                      columns={columns}
                      data={voidSearchResult}
                      keyExtractor={(row) => String(row.trxID)}
                      isLoading={isVoidSearching}
                      emptyIcon={SearchX}
                      emptyTitle="No Transactions Found"
                      emptyMessage="No voidable transactions found for this invoice."
                    />
                </CardContent>
              </Card>
            )}
        </SimulationWrapper>

        {/* SIMULATION RESULT CARD */}
        {isSimulating && simResult && (
            <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in max-w-2xl mx-auto">
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/10 shadow-md">
                  <CardHeader className="pb-3 border-b border-green-100 dark:border-green-900/30">
                      <CardTitle className="text-green-800 dark:text-green-400 flex items-center gap-2 text-lg">
                          <CheckCircle2 className="h-5 w-5" /> 
                          Void Successful (Simulation)
                      </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 grid grid-cols-2 gap-6">
                      <div>
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Transaction ID</p>
                          <p className="font-mono font-medium">{simResult.id}</p>
                      </div>
                      <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Refund Amount</p>
                          <p className="font-bold text-xl text-green-700">{formatCurrency(simResult.amount)}</p>
                      </div>
                  </CardContent>
              </Card>
            </div>
        )}

        {/* CONFIRMATION DIALOG */}
        <AlertDialog open={isVoidConfirmOpen} onOpenChange={setIsVoidConfirmOpen}>
          <AlertDialogContent className={cn(isSimulating && "border-amber-200")}>
            <AlertDialogHeader>
              <AlertDialogTitle className={cn(isSimulating && "text-amber-700 flex items-center gap-2")}>
                  {isSimulating && <FlaskConical className="h-5 w-5" />}
                  {isSimulating ? "Simulate Void?" : "Void Transaction"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isSimulating 
                  ? <span>You are about to simulate voiding transaction <strong>{voidingTransaction?.trxID}</strong>. <br/>The status will update locally, but no changes will be saved to the server.</span>
                  : <span>Are you sure you want to void transaction <strong>{voidingTransaction?.trxID}</strong>? <br/>This action cannot be undone and will mark the transaction as voided.</span>
                }
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* --- ADDED SECURITY INPUT (Moved outside of Header/Description!) --- */}
            {!isSimulating && (
                <div className="space-y-2 py-4 my-2 border-y border-red-100 dark:border-red-900/30">
                    <Label className="text-red-800 dark:text-red-400 font-semibold">
                        Type <span className="font-mono bg-red-100 dark:bg-red-900/50 px-1 py-0.5 rounded select-all">VOID</span> to confirm
                    </Label>
                    <Input 
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="VOID"
                        className="bg-red-50/50 dark:bg-red-950/20 uppercase focus-visible:ring-red-500"
                        autoComplete="off"
                    />
                </div>
            )}
            
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isVoiding}>Cancel</AlertDialogCancel>
                  <LoadingButton 
                      onClick={(e) => {
                          e.preventDefault(); 
                          handleVoidConfirm();
                      }} 
                      isLoading={isVoiding}
                      loadingText={isSimulating ? "Simulating..." : "Processing..."}
                      className={cn(isSimulating ? "bg-amber-500 hover:bg-amber-600 text-white" : "bg-destructive text-destructive-foreground hover:bg-destructive/90")}
                  >
                      {isSimulating ? "Run Simulation" : "Void Transaction"}
                  </LoadingButton>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}