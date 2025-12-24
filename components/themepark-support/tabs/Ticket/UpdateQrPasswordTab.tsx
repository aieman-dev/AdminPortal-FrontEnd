"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { SearchField } from "@/components/themepark-support/it-poswf/search-field" // <--- Import
import { PasswordDisplay } from "@/components/themepark-support/it-poswf/password-display"
import { type PasswordData } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useToast } from "@/hooks/use-toast"

export default function UpdateQrPasswordTab() {
  const { toast } = useToast()
  const searchParams = useSearchParams() 
  const urlQuery = searchParams.get('search')

  const [qrInvoiceNo, setQrInvoiceNo] = useState("")
  const [qrSearchResult, setQrSearchResult] = useState<PasswordData | null>(null)
  const [isQrSearching, setIsQrSearching] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleQrSearch = async (queryOverride?: string) => {
    const term = queryOverride !== undefined ? queryOverride : qrInvoiceNo;

    if (!term) return

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
            toast({ title: "Search Failed", description: response.error || "No password found.", variant: "destructive" });
        }
    } catch (error) {
        console.error("QR Search Error:", error);
        toast({ title: "Network Error", description: "Failed to connect to the search service.", variant: "destructive" });
    } finally {
      setIsQrSearching(false);
    }
  }

  useEffect(() => {
    if (urlQuery) {
        setQrInvoiceNo(urlQuery);
        handleQrSearch(urlQuery); // Trigger immediately
        window.history.replaceState(null, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlQuery]);

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
            toast({ title: "Reset Failed", description: response.error || "Could not reset password.", variant: "destructive" });
        }
    } catch (error) {
        console.error("QR Reset Error:", error);
        toast({ title: "Network Error", description: "Failed to connect to the reset service.", variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <>
      <Card>
        <CardContent>
          <SearchField
            label="Invoice Number"
            placeholder="Enter invoice number"
            value={qrInvoiceNo}
            onChange={setQrInvoiceNo}
            onSearch={() => handleQrSearch()}
            isSearching={isQrSearching}
          />
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