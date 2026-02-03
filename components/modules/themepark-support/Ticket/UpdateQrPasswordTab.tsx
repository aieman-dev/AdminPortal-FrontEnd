"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { SearchField } from "@/components/shared-components/search-field" // <--- Import
import { PasswordDisplay } from "@/components/shared-components/password-display"
import { type PasswordData } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support"
import { useAppToast } from "@/hooks/use-app-toast"
import { useAutoSearch } from "@/hooks/use-auto-search"

export default function UpdateQrPasswordTab() {
  const toast = useAppToast()

  const [qrInvoiceNo, setQrInvoiceNo] = useState("")
  const [qrSearchResult, setQrSearchResult] = useState<PasswordData | null>(null)
  const [isQrSearching, setIsQrSearching] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)

  const handleQrSearch = async (query?: string) => {
    const term = query !== undefined ? query : qrInvoiceNo;

    if (!term) return
    if (query !== undefined) setQrInvoiceNo(query);

    setIsQrSearching(true)
    setResetSuccess(false)
    setQrSearchResult(null);
    
    try {
        const response = await itPoswfService.searchQrPassword(qrInvoiceNo.trim());
        
        if (response.success && response.data) {
            setQrSearchResult(response.data);
            toast.success("Success", "QR Password retrieved.");
        } else {
            setQrSearchResult(null);
            toast.error("Search Failed", response.error || "No password found.");
        }
    } catch (error) {
        console.error("QR Search Error:", error);
        toast.error("Network Error", "Failed to connect to the search service.");
    } finally {
      setIsQrSearching(false);
    }
  }

  useAutoSearch(handleQrSearch);

  const handleResetPassword = async () => {
    if (!qrInvoiceNo) return
    setIsResetting(true)
    setResetSuccess(false)
    
    try {
        const response = await itPoswfService.resetQrPassword(qrInvoiceNo.trim());
        
        if (response.success && response.data) {
            setQrSearchResult(response.data);
            setResetSuccess(true);
            toast.success("Success", "QR Password has been reset.");
        } else {
            setResetSuccess(false);
            toast.error("Reset Failed", response.error || "Could not reset password.");
        }
    } catch (error) {
        console.error("QR Reset Error:", error);
        toast.error("Network Error", "Failed to connect to the reset service.");
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