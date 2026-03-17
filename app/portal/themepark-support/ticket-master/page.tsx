"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X, Calendar, Key, Wallet } from "lucide-react"
import { PullToRefresh } from "@/components/shared-components/pull-to-refresh"
import { LoaderState } from "@/components/ui/loader-state"
import { ResponsiveTabsHeader, TabOption } from "@/components/portal/responsive-tabs-header"
import dynamic from "next/dynamic"

const DeactivateTicketTab = dynamic(
  () => import("@/components/modules/themepark-support/Ticket/DeactivateTicketTab"), 
  { loading: () => <LoaderState /> }
)
const ExtendExpiryTab = dynamic(
  () => import("@/components/modules/themepark-support/Ticket/ExtendExpiryTab"), 
  { loading: () => <LoaderState /> }
)
const UpdateQrPasswordTab = dynamic(
  () => import("@/components/modules/themepark-support/Ticket/UpdateQrPasswordTab"), 
  { loading: () => <LoaderState /> }
)
const ManualConsumeTab = dynamic(
  () => import("@/components/modules/themepark-support/Ticket/ManualConsumeTab"), 
  { loading: () => <LoaderState /> }
)

export default function TicketMasterPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || "deactivate-ticket"

  const ticketTabs: TabOption[] = [
    { id: "deactivate-ticket", label: "Deactivate Ticket", icon: X },
    { id: "extend-expiry", label: "Extend Expiry", icon: Calendar },
    { id: "update-qr-password", label: "Update Security Password", icon: Key },
    { id: "manual-consume", label: "Manual Consume", icon: Wallet },
  ]

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleGlobalRefresh = async () => {
    window.dispatchEvent(new Event('refresh-active-tab'));
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  const tabTransitionClass = "mt-0 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forward";
  return (
    <PullToRefresh onRefresh={handleGlobalRefresh}>
      <div className="space-y-6 pb-12 min-h-[calc(100vh-80px)]">
        <PageHeader
          title="Ticket Master"
          description="Manage ticket lifecycles: deactivation, expiry extension, QR security, and manual consumption."
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
          <ResponsiveTabsHeader 
              tabs={ticketTabs} 
              activeTab={activeTab} 
              onValueChange={handleTabChange} 
          />

          <TabsContent value="deactivate-ticket" className={tabTransitionClass}>
              <DeactivateTicketTab />
          </TabsContent>
          <TabsContent value="extend-expiry" className={tabTransitionClass}>
              <ExtendExpiryTab />
          </TabsContent>
          <TabsContent value="update-qr-password"className={tabTransitionClass}>
              <UpdateQrPasswordTab />
          </TabsContent>
          <TabsContent value="manual-consume"className={tabTransitionClass}>
              <ManualConsumeTab />
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  )
}