"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
// Import Clock for the Date UI
import { Search, XCircle, Clock } from "lucide-react" 
import { DataTable, type TableColumn } from "@/components/themepark-support/it-poswf/data-table"
import { StatusBadge } from "@/components/themepark-support/it-poswf/status-badge"
import { type VoidTransaction } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"
// Import Badge for the Date UI
import { Badge } from "@/components/ui/badge" 

// --- Helper: Format Date to "10 Dec 2025, 7:01 pm" ---
const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-GB', { 
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true 
  }).format(date);
};

export default function VoidTransactionTab() {
  const { toast } = useToast()

  const [voidInvoiceNo, setVoidInvoiceNo] = useState("")
  const [voidSearchResult, setVoidSearchResult] = useState<VoidTransaction[]>([])
  const [isVoidSearching, setIsVoidSearching] = useState(false)
  const [isVoidConfirmOpen, setIsVoidConfirmOpen] = useState(false)
  const [voidingTransaction, setVoidingTransaction] = useState<VoidTransaction | null>(null)
  const [isVoiding, setIsVoiding] = useState(false)

  const handleVoidSearch = async () => {
    if (!voidInvoiceNo) return
    setIsVoidSearching(true)
    setVoidSearchResult([])

    try {
      const response = await itPoswfService.searchVoidTransactions(voidInvoiceNo.trim());

      if (response.success && response.data) {
        setVoidSearchResult(response.data);
        if (response.data.length === 0) {
          toast({
            title: "Search Complete",
            description: "No voidable transactions found for this invoice.",
          });
        }
      } else {
        setVoidSearchResult([]);
        toast({
          title: "Search Failed",
          description: response.error || "Could not retrieve transactions.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Void Search Error:", error);
      setVoidSearchResult([]);
      toast({
        title: "Network Error",
        description: "Failed to connect to the transaction search service.",
        variant: "destructive"
      });
    } finally {
      setIsVoidSearching(false)
    }
  }

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
        trxType: voidingTransaction.trxType, // Ensure your type has this field mapping
        itemType: voidingTransaction.itemType,
        Action: "Void" as const,
      };

      const response = await itPoswfService.executeVoidTransaction(payload);
      
      if (!response.success) {
        throw new Error(response.error || "Failed to communicate with API.");
      }
      
      // Update status locally to reflect the change immediately
      setVoidSearchResult((prev) => 
        prev.map((t) => (t.terminalID === voidingTransaction.terminalID ? { ...t, recordStatus: "Voided" } : t))
      )
      
      const responseMessage = response.data?.messaged || "Void request processed successfully.";

      toast({
        title: "Success",
        description: `Transaction ${voidingTransaction.trxID} has been voided successfully. Message: ${responseMessage}`,
      })

    } catch (error) {
      console.error("Void Error:", error);
      toast({
        title: "Void Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive"
      });
    } finally {
      setIsVoidConfirmOpen(false)
      setVoidingTransaction(null)
      setIsVoiding(false)
    }
  }

  const voidTransactionColumns: TableColumn<VoidTransaction>[] = [
    {
      header: "Transaction ID",
      accessor: "trxID",
      cell: (value) => <span className="font-medium">{value}</span>,
    },
    { header: "Invoice No", accessor: "invoiceNo" },
    
    // Using your StatusBadge for consistency
    { header: "Transaction Type", accessor: "trxType", cell: (value) => <StatusBadge status={value} /> }, // Checked JSON: key is 'trxType'
    { header: "Item Type", accessor: "itemType", cell: (value) => <StatusBadge status={value} /> },
    { header: "Balance Quantity", accessor: "balanceQty" }, // Checked JSON: key is 'balanceQty'
    { header: "Amount", accessor: "amount", cell: (value) => `RM ${(value ?? 0).toFixed(2)}`},
    { header: "Terminal", accessor: "terminalID" }, 
    { header: "Status", accessor: "recordStatus", cell: (value) => <StatusBadge status={value} /> 
    },
    { header: "Created Date", accessor: "createdDate",
        cell: (value) => (
            <Badge variant="outline" className="font-normal text-xs text-gray-600 bg-gray-100 border-gray-200 gap-1.5 py-1 px-2.5 w-[160px] justify-center">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                {formatDate(value as string)}
            </Badge>
        )
    },
    {
      header: "Action",
      accessor: "trxID", // Usually implies ID
      cell: (_, row) => (
        <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => handleVoidClick(row)} 
            disabled={row.recordStatus === "Voided"} // Check against recordStatus
        >
          <XCircle className="h-4 w-4 mr-2" />
          Void
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="void-invoice" className="text-sm font-medium">
              Invoice Number
            </Label>
            <div className="flex gap-2">
              <Input
                id="void-invoice"
                placeholder="Enter invoice number"
                value={voidInvoiceNo}
                onChange={(e) => setVoidInvoiceNo(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleVoidSearch} disabled={isVoidSearching} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isVoidSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {voidSearchResult.length > 0 && (
        <Card>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-2 text-sm font-medium">
              <XCircle className="h-4 w-4" />
              Transaction Details
            </div>
            <DataTable
              columns={voidTransactionColumns}
              data={voidSearchResult}
              keyExtractor={(row) => String(row.trxID)}
              emptyMessage="No transactions found"
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
            <AlertDialogAction
              onClick={handleVoidConfirm}
              disabled={isVoiding}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isVoiding ? "Voiding..." : "Void Transaction"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}