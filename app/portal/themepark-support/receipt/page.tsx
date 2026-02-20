"use client"

import { useEffect, useState, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { ReceiptView, ReceiptData } from "@/components/modules/themepark-support/Receipt/ReceiptView"
import { itPoswfService } from "@/services/themepark-support"
import { LoaderState } from "@/components/ui/loader-state"
import { EmptyState } from "@/components/portal/empty-state"
import { SearchX, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ReceiptPage() {
    const searchParams = useSearchParams();
    const invoiceNo = searchParams.get('invoiceNo');
    const returnTo = searchParams.get('returnTo');
    const router = useRouter();

    const [data, setData] = useState<ReceiptData | null>(null);
    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState(1);
    
    // Use ref to prevent strict mode double-fetch issues in dev
    const isFetching = useRef(false);

    const fetchReceipt = async (retryCount = 0) => {
        if (!invoiceNo) {
            setLoading(false);
            return;
        }

        // --- CHECK LOCAL CACHE FIRST ---
        if (retryCount === 0) {
            const cached = sessionStorage.getItem(`receipt_cache_${invoiceNo}`);
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    setData(parsed);
                    setLoading(false);
                    return; // Exit early, we have data!
                } catch (e) {
                    console.error("Cache parse error", e);
                }
            }
        }
        
        // Prevent concurrent fetches
        if (isFetching.current) return;
        isFetching.current = true;
        setLoading(true);

        try {
            console.log(`Fetching Receipt for ${invoiceNo} (Attempt ${retryCount + 1})...`);
            
            // Reusing existing searchHistory API
            const response = await itPoswfService.searchHistory("invoice", invoiceNo);
            
            // Check if we actually got transaction items
            const txHistory = response.data?.transactionHistory || [];
            
            if (response.success && txHistory.length > 0) {
                // SUCCESS: Data found
                const firstTx = txHistory[0];
                const total = txHistory.reduce((sum, item) => sum + (item.amount || 0), 0);
                
                const receiptData: ReceiptData = {
                    invoiceNo: firstTx.invoiceNo,
                    date: firstTx.createdDate,
                    customerEmail: firstTx.email,
                    customerName: "Guest",
                    status: firstTx.trxType === "Consume" ? "Consumed" : "Paid",
                    totalAmount: total,
                    items: txHistory.map(tx => ({
                        name: tx.attractionName,
                        amount: tx.amount,
                        qty: 1
                    }))
                };
                setData(receiptData);
                setLoading(false);
            } else {
                // FAILURE: No data found yet
                if (retryCount < 3) {
                    // Retry logic (wait 2s and try again)
                    console.warn("Receipt not found yet, retrying in 2s...");
                    setTimeout(() => {
                        isFetching.current = false;
                        setAttempt(prev => prev + 1);
                        fetchReceipt(retryCount + 1);
                    }, 2000);
                } else {
                    // Give up after 3 retries
                    console.error("Receipt not found after max retries.");
                    setData(null);
                    setLoading(false);
                    isFetching.current = false;
                }
            }
        } catch (error) {
            console.error("Receipt Load Error", error);
            setLoading(false);
            isFetching.current = false;
        } finally {
            // Only unset fetching flag here if we aren't retrying
            // (If retrying, the timeout callback handles the flag)
        }
    };

    useEffect(() => {
        // Initial fetch
        if(invoiceNo) {
            fetchReceipt(0);
        }
    }, [invoiceNo]);

    const handleManualRefresh = () => {
        isFetching.current = false;
        fetchReceipt(0);
    }

    const handleGoBack = () => {
        if (returnTo) {
            router.replace(returnTo); 
        } else {
            router.back(); 
        }
    };

    if (loading) return (
        <LoaderState 
            message={attempt > 1 ? `Syncing Receipt... (Attempt ${attempt}/4)` : "Generating Receipt..."} 
        />
    );
    
    if (!invoiceNo || !data) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-6">
                 <EmptyState 
                    icon={SearchX} 
                    title="Receipt Not Found" 
                    description={invoiceNo ? `The record for #${invoiceNo} is pending synchronization.` : "No invoice number provided."}
                 />
                 <div className="flex gap-4">
                    <Button variant="outline" onClick={handleGoBack}>
                        Go Back
                    </Button>
                    <Button onClick={handleManualRefresh} className="gap-2">
                        <RefreshCw className="h-4 w-4" /> Try Again
                    </Button>
                 </div>
            </div>
        );
    }

    return <ReceiptView data={data} onBack={handleGoBack} />;
}