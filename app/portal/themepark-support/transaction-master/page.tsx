"use client"

import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { XCircle, Wallet, CheckCircle2, ShoppingBag, Settings, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// --- LAZY LOADING COMPONENTS ---
const VoidTransactionTab = dynamic(
    () => import("@/components/themepark-support/tabs/Transaction/voidTransactionTab"),
    { loading: () => <TabLoadingState /> }
)
const RetailManualConsumeTab = dynamic(
    () => import("@/components/themepark-support/tabs/Transaction/RetailManualConsumeTab"),
    { loading: () => <TabLoadingState /> }
)
const ResyncTransactionTab = dynamic(
    () => import("@/components/themepark-support/tabs/Transaction/ResyncTransactionTab"),
    { loading: () => <TabLoadingState /> }
)
const ShopifyOrderTab = dynamic(
    () => import("@/components/themepark-support/tabs/Transaction/ShopifyOrderTab"),
    { loading: () => <TabLoadingState /> }
)
const ConsumeTerminalTab = dynamic(
    () => import("@/components/themepark-support/tabs/Transaction/ConsumeTerminalTab"),
    { loading: () => <TabLoadingState /> }
)

// Reusable Loading Component (Same visual style)
function TabLoadingState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground h-[400px] border rounded-lg bg-muted/10">
      <Loader2 className="h-10 w-10 animate-spin mb-4 text-primary" />
      <p>Loading module...</p>
    </div>
  )
}


export default function TransactionMasterPage() {
  const tabTransitionClass = "mt-0 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forward";
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaction Master"
        description="Unified management for transaction reversal, consumption, resync, and Shopify order validation."
      />

      <Tabs defaultValue="void-transaction" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
            <TabsTrigger value="void-transaction" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10">
              <XCircle className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Void Transaction
            </TabsTrigger>
            <TabsTrigger value="retail-manual-consume" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Wallet className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Retail/F&B Consume
            </TabsTrigger>
            <TabsTrigger value="resync-transaction" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <CheckCircle2 className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Resync Transaction
            </TabsTrigger>
            <TabsTrigger value="shopify-order" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <ShoppingBag className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Shopify Order
            </TabsTrigger>
            <TabsTrigger value="consume-terminal" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Settings className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Consume Terminal
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="void-transaction" className={tabTransitionClass}>
            <VoidTransactionTab />
        </TabsContent>
        
        <TabsContent value="retail-manual-consume" className={tabTransitionClass}>
            <RetailManualConsumeTab />
        </TabsContent>
        
        <TabsContent value="resync-transaction" className={tabTransitionClass}>
            <ResyncTransactionTab />
        </TabsContent>
        
        <TabsContent value="shopify-order" className={tabTransitionClass}>
            <ShopifyOrderTab />
        </TabsContent>
        
        <TabsContent value="consume-terminal" className={tabTransitionClass}>
            <ConsumeTerminalTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}