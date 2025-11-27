// components/it-poswf/tabs/Ticket/UpdateQrPasswordTab.tsx
"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { PasswordDisplay } from "@/components/themepark-support/it-poswf/password-display"
import { type PasswordData } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"

export default function UpdateQrPasswordTab() {
  const { toast } = useToast()

  const [qrInvoiceNo, setQrInvoiceNo] = useState("")
  const [qrSearchResult, setQrSearchResult] = useState<PasswordData | null>(null)
  const [isQrSearching, setIsQrSearching] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleQrSearch = async () => {
    if (!qrInvoiceNo) return
   setIsQrSearching(true)
    setResetSuccess(false)
    setQrSearchResult(null);
    
    try {
        const response = await itPoswfService.searchQrPassword(qrInvoiceNo.trim());
        
        if (response.success && response.data) {
            setQrSearchResult(response.data);
            toast({ title: "Success", description: "QR Password retrieved." });
        } else {
            setQrSearchResult(null);
            toast({
                title: "Search Failed",
                description: response.error || "No password found for this invoice.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("QR Search Error:", error);
        toast({
            title: "Network Error",
            description: "Failed to connect to the search service.",
            variant: "destructive"
        });
    } finally {
      setIsQrSearching(false);
    }
  }

  const handleResetPassword = async () => {
    if (!qrInvoiceNo) return
    setIsResetting(true)
    setResetSuccess(false)
    
    try {
        const response = await itPoswfService.resetQrPassword(qrInvoiceNo.trim());
        
        if (response.success && response.data) {
            setQrSearchResult(response.data);
            setResetSuccess(true);
            toast({ title: "Success", description: "QR Password has been reset." });
        } else {
            setResetSuccess(false);
            toast({
                title: "Reset Failed",
                description: response.error || "Could not reset password.",
                variant: "destructive"
            });
        }
    } catch (error) {
        console.error("QR Reset Error:", error);
        toast({
            title: "Network Error",
            description: "Failed to connect to the reset service.",
            variant: "destructive"
        });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="qr-invoice" className="text-sm font-medium">
              Invoice Number
            </Label>
            <div className="flex gap-2">
              <Input
                id="qr-invoice"
                placeholder="Enter invoice number"
                value={qrInvoiceNo}
                onChange={(e) => setQrInvoiceNo(e.target.value)}
                className="h-11"
              />
              <Button onClick={handleQrSearch} disabled={isQrSearching} className="h-11 px-8">
                <Search className="mr-2 h-4 w-4" />
                {isQrSearching ? "Searching..." : "Search"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {qrSearchResult && (
        <PasswordDisplay
          invoiceNo={qrSearchResult.invoiceNo}
          currentPassword={qrSearchResult.currentPassword}
          onReset={handleResetPassword}
          isResetting={isResetting}
          resetSuccess={resetSuccess}
        />
      )}
    </>
  )
}