"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { XCircle, Clock, SearchX } from "lucide-react" 
import { DataTable, type TableColumn } from "@/components/shared-components/data-table"
import { StatusBadge } from "@/components/shared-components/status-badge"
import { SearchField } from "@/components/shared-components/search-field" // <--- Import
import { type VoidTransaction } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { formatCurrency, formatDate } from "@/lib/formatter";
import { useAppToast } from "@/hooks/use-app-toast"
import { Badge } from "@/components/ui/badge" 
import { useAutoSearch } from "@/hooks/use-auto-search"


export default function VoidTransactionTab() {
  const toast = useAppToast()

  const [voidInvoiceNo, setVoidInvoiceNo] = useState("")
  const [voidSearchResult, setVoidSearchResult] = useState<VoidTransaction[]>([])
  const [isVoidSearching, setIsVoidSearching] = useState(false)
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false)
  const [voidingTransaction, setVoidingTransaction] = useState<VoidTransaction | null>(null)
  const [isVoiding, setIsVoiding] = useState(false)

  const handleVoidSearch = async (query: string) => {
    if (!query) return
    
    // Sync input state if triggered via URL
    setVoidInvoiceNo(query);
    setIsVoidSearching(true)
    setVoidSearchResult([])

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
  }

  useAutoSearch(handleVoidSearch);

  const handleVoidClick = (transaction: VoidTransaction) => {
    setVoidingTransaction(transaction)
    setIsVoidConfirmOpen(true)
  }

  const handleVoidConfirm = async () => {
    if (!voidingTransaction) return
    setIsVoiding(true)
    
    try {
      const payload = {
        TrxID: Number(voidingTransaction.trxID), 
        InvoiceNo: voidingTransaction.invoiceNo,
        BalanceQty: -1, 
        trxType: voidingTransaction.trxType, 
        itemType: voidingTransaction.itemType,
        Action: "Void" as const,
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

    } catch (error) {
      console.error("Void Error:", error);
      toast.error( "Void Failed", error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
      setIsVoidConfirmOpen(false)
      setVoidingTransaction(null)
      setIsVoiding(false)
    }
  }

  const columns: TableColumn<VoidTransaction>[] = [
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
        >
          <XCircle className="h-4 w-4 mr-2" /> Void
        </Button>
      ),
    },
  ]

  return (
    <>
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

      <AlertDialog open={isVoidConfirmOpen} onOpenChange={setIsVoidConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Void Transaction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to void transaction {voidingTransaction?.trxID}? This action cannot be
              undone and will mark the transaction as voided.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoiding}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleVoidConfirm} disabled={isVoiding} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isVoiding ? "Voiding..." : "Void Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}