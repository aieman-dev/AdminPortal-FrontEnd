"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2 } from "lucide-react"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"
import { itPoswfService } from "@/services/themepark-support"
import { SearchField } from "@/components/shared-components/search-field" // <--- Import Standard Component

export default function ResyncTransactionTab() {
  const toast = useAppToast()
  
  const [transactionId, setTransactionId] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [showResyncSuccess, setShowResyncSuccess] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  const handleExecute = useCallback(async (idOverride?: string) => {
    const targetId = idOverride !== undefined ? idOverride : transactionId;

    if (!targetId.trim()) {
      toast.info("Input Required", "Please enter a Transaction ID.");
      return;
    }
    if (idOverride !== undefined) setTransactionId(idOverride);

    setIsExecuting(true)
    setShowResyncSuccess(false)
    setSuccessMessage("")

    try {
        const response = await itPoswfService.resyncTransaction(transactionId.trim());

        if (response.success) {
            const msg = response.data?.message || "Transaction migrated/resynced successfully.";
            setSuccessMessage(msg);
            setShowResyncSuccess(true);
            toast.success("Success", msg);
            
            setTimeout(() => setShowResyncSuccess(false), 5000);
        } else {
            const errorMsg = response.error || "";
            if (
                errorMsg.includes("No eligible transaction items found") || 
                errorMsg.includes("already resync") ||
                errorMsg.includes("InternalServerError") 
            ) {
                toast.info("Notice", `Transaction ${targetId} is already synced.`);
            } else {
                throw new Error(errorMsg || "Resync failed.");
            }
        }
    } catch (error) {
        console.error("Resync Error:", error);
        toast.error("Resync Failed", error instanceof Error ? error.message : "An unexpected error occurred.");
    } finally {
        setIsExecuting(false);
    }
  }, [transactionId]) 

  useAutoSearch(handleExecute);


  // Listen for the global refresh event
  useEffect(() => {
    const handleTabRefresh = () => {
        if (transactionId) {
            handleExecute(transactionId);
        }
    };

    window.addEventListener('refresh-active-tab', handleTabRefresh);
    return () => window.removeEventListener('refresh-active-tab', handleTabRefresh);
  }, [transactionId]);

  
  return (
    <>
      <Card>
        <CardContent>
          <SearchField 
            label="Transaction ID"
            placeholder="Enter transaction ID"
            value={transactionId}
            onChange={setTransactionId}
            onSearch={() => handleExecute()}
            isSearching={isExecuting}
          />
        </CardContent>
      </Card>

      {showResyncSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950 mt-6">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}