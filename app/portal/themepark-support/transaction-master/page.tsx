// app/portal/it-poswf/transaction-master/page.tsx
"use client"

import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { XCircle, Wallet, CheckCircle2, ShoppingBag, Settings } from "lucide-react"

// Import Extracted Tab Components
import VoidTransactionTab from "@/components/themepark-support/tabs/Transaction/voidTransactionTab"
import ResyncTransactionTab from "@/components/themepark-support/tabs/Transaction/ResyncTransactionTab"
import ShopifyOrderTab from "@/components/themepark-support/tabs/Transaction/ShopifyOrderTab"
import ManualConsumeTab from "@/components/themepark-support/tabs/Ticket/ManualConsumeTab" // Reused component
import ConsumeTerminalTab from "@/components/themepark-support/tabs/Transaction/ConsumeTerminalTab"

export default function TransactionMasterPage() {
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
            <TabsTrigger value="manual-consume" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Wallet className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Manual Consume
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

        <TabsContent value="void-transaction" className="mt-0 space-y-6"><VoidTransactionTab /></TabsContent>
        <TabsContent value="manual-consume" className="mt-0 space-y-6"><ManualConsumeTab /></TabsContent>
        <TabsContent value="resync-transaction" className="mt-0 space-y-6"><ResyncTransactionTab /></TabsContent>
        <TabsContent value="shopify-order" className="mt-0 space-y-6"><ShopifyOrderTab /></TabsContent>
        <TabsContent value="consume-terminal" className="mt-0 space-y-6"><ConsumeTerminalTab /></TabsContent>
      </Tabs>
    </div>
  )
}