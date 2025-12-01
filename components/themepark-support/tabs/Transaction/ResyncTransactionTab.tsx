// components/themepark-support/tabs/Transaction/ResyncTransactionTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, CheckCircle2, RefreshCw, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { itPoswfService } from "@/services/themepark-support"

export default function ResyncTransactionTab() {
  const { toast } = useToast()
  
  const [transactionId, setTransactionId] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [showResyncSuccess, setShowResyncSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleExecute = async () => {
    if (!transactionId.trim()) {
        toast({ title: "Input Required", description: "Please enter a Transaction ID.", variant: "destructive" });
        return;
    }

    setIsExecuting(true)
    setShowResyncSuccess(false)
    setSuccessMessage("")

    try {
        const response = await itPoswfService.resyncTransaction(transactionId.trim());

        if (response.success) {
            const msg = response.data?.message || "Transaction migrated/resynced successfully.";
            setSuccessMessage(msg);
            setShowResyncSuccess(true);
            toast({ title: "Success", description: msg });
            
            setTimeout(() => setShowResyncSuccess(false), 5000);
        } else {
            // Handle specific "Already Resynced" case
            const errorMsg = response.error || "";
            if (errorMsg.includes("No eligible transaction items found")) {
                toast({ 
                    title: "Notice", 
                    description: `Transaction ${transactionId} is already synced.`,
                    variant: "default", // Use default (usually white/black) or implement a 'warning' variant if available
                    className: "border-l-4 border-yellow-500" // Simple style tweak to indicate warning
                });
            } else {
                // Genuine Error
                throw new Error(errorMsg || "Resync failed.");
            }
        }
    } catch (error) {
        console.error("Resync Error:", error);
        toast({
            title: "Resync Failed",
            description: error instanceof Error ? error.message : "An unexpected error occurred.",
            variant: "destructive"
        });
    } finally {
        setIsExecuting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="transaction-id" className="text-sm font-medium">
              Transaction ID
            </Label>
            <div className="flex gap-2">
              <Input
                id="transaction-id"
                placeholder="Enter transaction ID (e.g. 1378)"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleExecute} disabled={isExecuting} className="h-11 px-8">
                {isExecuting ? (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Syncing...
                    </>
                ) : (
                    <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Resync
                    </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showResyncSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}