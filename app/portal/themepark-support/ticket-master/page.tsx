"use client"

import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { X, Calendar, Key, Wallet, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// --- LAZY LOADING CONFIGURATION ---
const TabLoading = () => (
  <div className="flex flex-col items-center justify-center py-24 text-muted-foreground border rounded-lg bg-muted/5 h-[400px]">
    <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
    <p>Loading module...</p>
  </div>
)

const DeactivateTicketTab = dynamic(
  () => import("@/components/themepark-support/tabs/Ticket/DeactivateTicketTab"), 
  { loading: () => <TabLoading /> }
)
const ExtendExpiryTab = dynamic(
  () => import("@/components/themepark-support/tabs/Ticket/ExtendExpiryTab"), 
  { loading: () => <TabLoading /> }
)
const UpdateQrPasswordTab = dynamic(
  () => import("@/components/themepark-support/tabs/Ticket/UpdateQrPasswordTab"), 
  { loading: () => <TabLoading /> }
)
const ManualConsumeTab = dynamic(
  () => import("@/components/themepark-support/tabs/Ticket/ManualConsumeTab"), 
  { loading: () => <TabLoading /> }
)

export default function TicketMasterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Master"
        description="Manage ticket lifecycles: deactivation, expiry extension, QR security, and manual consumption."
      />

      <Tabs defaultValue="deactivate-ticket" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
            <TabsTrigger value="deactivate-ticket" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10">
              <X className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Deactivate Ticket
            </TabsTrigger>
            <TabsTrigger value="extend-expiry" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Calendar className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Extend Expiry
            </TabsTrigger>
            <TabsTrigger value="update-qr-password" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Key className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Update Security Password
            </TabsTrigger>
            <TabsTrigger value="manual-consume" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Wallet className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Manual Consume
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="deactivate-ticket" className="mt-0 space-y-6">
            <DeactivateTicketTab />
        </TabsContent>
        <TabsContent value="extend-expiry" className="mt-0 space-y-6">
            <ExtendExpiryTab />
        </TabsContent>
        <TabsContent value="update-qr-password" className="mt-0 space-y-6">
            <UpdateQrPasswordTab />
        </TabsContent>
        <TabsContent value="manual-consume" className="mt-0 space-y-6">
            <ManualConsumeTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}