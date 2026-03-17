"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PackageIcon, Settings, History, DivideCircle } from "lucide-react"
import { LoaderState } from "@/components/ui/loader-state"
import { PullToRefresh } from "@/components/shared-components/pull-to-refresh"
import { ResponsiveTabsHeader, TabOption } from "@/components/portal/responsive-tabs-header"
import dynamic from "next/dynamic"

// --- LAZY LOADING COMPONENTS ---
// This splits the code into small chunks. They are only fetched when needed.
const PackageListingTab = dynamic(
  () => import("@/components/modules/themepark-support/Attraction/PackageListingTab"),
  { loading: () => <LoaderState /> }
)
const UpdateTerminalTab = dynamic(
  () => import("@/components/modules/themepark-support/Attraction/UpdateTerminalTab"),
  { loading: () => <LoaderState /> }
)
const ConsumeHistoryByTerminalTab = dynamic(
  () => import("@/components/modules/themepark-support/Attraction/ConsumeHistoryByTerminalTab"),
  { loading: () => <LoaderState /> }
)
const BComparePackageTab = dynamic(
  () => import("@/components/modules/themepark-support/Attraction/BComparePackageTab"),
  { loading: () => <LoaderState /> }
)


export default function AttractionMasterPage() {
   const router = useRouter()
   const pathname = usePathname()
   const searchParams = useSearchParams()
   const activeTab = searchParams.get('tab') || "package-listing"

   const attractionTabs: TabOption[] = [
    { id: "package-listing", label: "Package Listing", icon: PackageIcon },
    { id: "update-terminal", label: "Update Terminal", icon: Settings },
    { id: "consume-history-by-terminal", label: "Terminal History", icon: History },
    { id: "bcompare-package", label: "BCompare Package", icon: DivideCircle },
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
          title="Attraction Master"
          description="Manage packages, terminal access, and retrieve consumption history by terminal."
        />

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 w-full">
          <ResponsiveTabsHeader 
              tabs={attractionTabs} 
              activeTab={activeTab} 
              onValueChange={handleTabChange} 
          />

          <TabsContent value="package-listing"className={tabTransitionClass}>
              <PackageListingTab />
          </TabsContent>
          
          <TabsContent value="update-terminal" className={tabTransitionClass}>
              <UpdateTerminalTab />
          </TabsContent>
          
          <TabsContent value="consume-history-by-terminal" className={tabTransitionClass}>
              <ConsumeHistoryByTerminalTab />
          </TabsContent>
          
          <TabsContent value="bcompare-package" className={tabTransitionClass}>
              <BComparePackageTab />
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  )
}