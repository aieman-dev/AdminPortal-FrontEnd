// components/it-poswf/tabs/Transaction/ResyncTransactionTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Search, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ResyncTransactionTab() {
  const { toast } = useToast()
  
  const [transactionId, setTransactionId] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)
  const [showResyncSuccess, setShowResyncSuccess] = useState(false)

  const handleExecute = async () => {
    if (!transactionId.trim()) return
    setIsExecuting(true)
    setShowResyncSuccess(false)
    // MOCK: This endpoint is not yet hooked up to a real service (as per original file)
    setTimeout(() => { 
      setIsExecuting(false)
      setShowResyncSuccess(true)
      toast({ title: "Success", description: `Transaction Resync (MOCK) executed for ID: ${transactionId}` });
      setTimeout(() => setShowResyncSuccess(false), 5000)
    }, 1000)
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
                placeholder="Enter transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleExecute} disabled={isExecuting} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isExecuting ? "Executing..." : "Execute"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showResyncSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-600 dark:text-green-400 font-medium">
            Transaction migrated successfully
          </AlertDescription>
        </Alert>
      )}
    </>
  )
}