"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PullToRefresh } from "@/components/shared-components/pull-to-refresh"
import { XCircle, Wallet, CheckCircle2, ShoppingBag, Settings } from "lucide-react"
import { LoaderState } from "@/components/ui/loader-state"
import { ResponsiveTabsHeader, TabOption } from "@/components/portal/responsive-tabs-header"
import dynamic from "next/dynamic"

// --- LAZY LOADING COMPONENTS ---
const VoidTransactionTab = dynamic(
    () => import("@/components/modules/themepark-support/Transaction/voidTransactionTab"),
    { loading: () => <LoaderState /> }
)
const RetailManualConsumeTab = dynamic(
    () => import("@/components/modules/themepark-support/Transaction/RetailManualConsumeTab"),
    { loading: () => <LoaderState /> }
)
const ResyncTransactionTab = dynamic(
    () => import("@/components/modules/themepark-support/Transaction/ResyncTransactionTab"),
    { loading: () => <LoaderState /> }
)
const ShopifyOrderTab = dynamic(
    () => import("@/components/modules/themepark-support/Transaction/ShopifyOrderTab"),
    { loading: () => <LoaderState /> }
)
const ConsumeTerminalTab = dynamic(
    () => import("@/components/modules/themepark-support/Transaction/ConsumeTerminalTab"),
    { loading: () => <LoaderState /> }
)

export default function TransactionMasterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || "void-transaction";

  // 1. Define your tab structure once
  const transactionTabs: TabOption[] = [
    { id: "void-transaction", label: "Void Transaction", icon: XCircle },
    { id: "retail-manual-consume", label: "Retail/F&B Consume", icon: Wallet },
    { id: "resync-transaction", label: "Resync Transaction", icon: CheckCircle2 },
    { id: "shopify-order", label: "Shopify Order", icon: ShoppingBag },
    { id: "consume-terminal", label: "Purchase/Consume History", icon: Settings },
  ]

  // 2. Handle tab switching (updates URL for back-button support)
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const tabTransitionClass = "mt-0 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forward";
  
  //  Dispatch a custom event when the user pulls down
  const handleGlobalRefresh = async () => {
    window.dispatchEvent(new Event('refresh-active-tab'));
    
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  return (
    <PullToRefresh onRefresh={handleGlobalRefresh}>
        <div className="space-y-6 pb-12 min-h-[calc(100vh-80px)]">
        <PageHeader
            title="Transaction Master"
            description="Unified management for transaction reversal, consumption, resync, and Shopify order validation."
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">

            {/* SHARED HEADER COMPONENT */}
            <ResponsiveTabsHeader 
                tabs={transactionTabs} 
                activeTab={activeTab} 
                onValueChange={handleTabChange} 
            />

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
    </PullToRefresh>
  )
}