"use client"

import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Users, History, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// --- LAZY LOADING ---
const TabLoading = () => (
  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground h-[300px] border rounded-lg bg-muted/10">
    <Loader2 className="h-8 w-8 animate-spin mb-3 text-primary" />
    <p>Loading account module...</p>
  </div>
)

const AccountManagementTab = dynamic(
  () => import("@/components/themepark-support/tabs/Account/AccountManagementTab"), 
  { loading: () => <TabLoading /> }
)
const SearchHistoryRecordTab = dynamic(
  () => import("@/components/themepark-support/tabs/Account/SearchHistoryRecordTab"), 
  { loading: () => <TabLoading /> }
)

export default function AccountMasterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Account Master"
        description="Search, edit, and manage user accounts and retrieve all associated transaction history."
      />

      <Tabs defaultValue="account-management" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
            <TabsTrigger value="account-management" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10">
              <Users className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Account Management
            </TabsTrigger>
            <TabsTrigger value="search-history-record" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <History className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Search History Record
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="account-management" className="mt-0 space-y-6">
            <AccountManagementTab />
        </TabsContent>
        <TabsContent value="search-history-record" className="mt-0 space-y-6">
            <SearchHistoryRecordTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}