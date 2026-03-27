"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ReceiptView, ReceiptData } from "@/components/modules/themepark-support/Receipt/ReceiptView"
import { itPoswfService } from "@/services/themepark-support"
import { LoaderState } from "@/components/ui/loader-state"
import { EmptyState } from "@/components/portal/empty-state"
import { SearchX, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logger } from "@/lib/logger"

export default function ReceiptPage() {
    const searchParams = useSearchParams();
    const invoiceNo = searchParams.get('invoiceNo');
    const returnTo = searchParams.get('returnTo');
    const encodedData = searchParams.get('data');
    const router = useRouter();

    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadReceipt = async () => {
            if (!invoiceNo) {
                setLoading(false);
                return;
            }

            // 1. PRIMARY: Read from URL state (Survives refresh & new tabs)
            if (encodedData) {
                try {
                    const decodedStr = Buffer.from(encodedData, 'base64').toString('utf-8');
                    const parsedData = JSON.parse(decodedStr);
                    setData(parsedData);
                    setLoading(false);
                    return; 
                } catch (e) {
                    logger.error("Failed to decode receipt data from URL", { error: e });
                    // Fall through to API fetch if tampering occurred
                }
            }

            // 2. FALLBACK: Database Fetch (If user navigated here manually with just an InvoiceNo)
            try {
                const response = await itPoswfService.searchHistory("invoice", invoiceNo);
                const txHistory = response.data?.transactionHistory || [];
                
                if (response.success && txHistory.length > 0) {
                    const firstTx = txHistory[0];
                    const total = txHistory.reduce((sum, item) => sum + (item.amount || 0), 0);
                    
                    setData({
                        invoiceNo: firstTx.invoiceNo,
                        date: firstTx.createdDate,
                        customerEmail: firstTx.email,
                        customerName: "Guest", // Note: API limitation, customer name not provided by backend
                        status: firstTx.trxType === "Consume" ? "Consumed" : "Paid",
                        totalAmount: total,
                        items: txHistory.map(tx => ({
                            name: tx.attractionName,
                            amount: tx.amount,
                            qty: 1
                        }))
                    });
                } else {
                    setData(null);
                }
            } catch (error) {
                logger.error("Receipt API Fallback Error", { error });
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        loadReceipt();
    }, [invoiceNo, encodedData]);


    const handleGoBack = () => {
        if (returnTo) router.replace(returnTo); 
        else router.back(); 
    };

    if (loading) return <LoaderState message="Generating Receipt..." />;
    
    if (!invoiceNo || !data) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                 <EmptyState 
                    icon={SearchX} 
                    title="Receipt Not Found" 
                    description="The invoice number is invalid or pending database synchronization."
                 />
                 <div className="flex gap-4">
                    <Button variant="outline" onClick={handleGoBack}>Go Back</Button>
                    <Button onClick={() => window.location.reload()} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Try Again
                    </Button>
                 </div>
            </div>
        );
    }

    return <ReceiptView data={data} onBack={handleGoBack} />;
}