"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Users, History, Loader2 } from "lucide-react"
import { LoaderState } from "@/components/ui/loader-state"
import { ResponsiveTabsHeader, TabOption } from "@/components/portal/responsive-tabs-header"
import dynamic from "next/dynamic"


const AccountManagementTab = dynamic(
  () => import("@/components/modules/themepark-support/Account/AccountManagementTab"), 
  { loading: () => <LoaderState message="Loading account module..." className="h-[300px]" /> }
)
const SearchHistoryRecordTab = dynamic(
  () => import("@/components/modules/themepark-support/Account/SearchHistoryRecordTab"), 
  { loading: () => <LoaderState message="Loading search history module..." className="h-[300px]"  /> }
)

export default function AccountMasterPage() {
   const router = useRouter()
   const pathname = usePathname()
   const searchParams = useSearchParams()
   const activeTab = searchParams.get('tab') || "account-management"

   const accountTabs: TabOption[] = [
    { id: "account-management", label: "Account Management", icon: Users },
    { id: "search-history-record", label: "Search History Record", icon: History },
   ]

   const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`${pathname}?${params.toString()}`)
   }

   const tabTransitionClass = "mt-0 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forward";
  
   return (
    <div className="space-y-6">
      <PageHeader
        title="Account Master"
        description="Search, edit, and manage user accounts and retrieve all associated transaction history."
      />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <ResponsiveTabsHeader 
            tabs={accountTabs} 
            activeTab={activeTab} 
            onValueChange={handleTabChange} 
        />

        <TabsContent value="account-management" className={tabTransitionClass}>
            <AccountManagementTab />
        </TabsContent>
        <TabsContent value="search-history-record" className={tabTransitionClass}>
            <SearchHistoryRecordTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}