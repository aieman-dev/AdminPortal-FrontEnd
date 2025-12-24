"use client"

import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PackageIcon, Settings, History, DivideCircle } from "lucide-react"
import { LoaderState } from "@/components/ui/loader-state"
import dynamic from "next/dynamic"

// --- LAZY LOADING COMPONENTS ---
// This splits the code into small chunks. They are only fetched when needed.
const PackageListingTab = dynamic(
  () => import("@/components/themepark-support/tabs/Attraction/PackageListingTab"),
  { loading: () => <LoaderState /> }
)
const UpdateTerminalTab = dynamic(
  () => import("@/components/themepark-support/tabs/Attraction/UpdateTerminalTab"),
  { loading: () => <LoaderState /> }
)
const ConsumeHistoryByTerminalTab = dynamic(
  () => import("@/components/themepark-support/tabs/Attraction/ConsumeHistoryByTerminalTab"),
  { loading: () => <LoaderState /> }
)
const BComparePackageTab = dynamic(
  () => import("@/components/themepark-support/tabs/Attraction/BComparePackageTab"),
  { loading: () => <LoaderState /> }
)


export default function AttractionMasterPage() {
   const tabTransitionClass = "mt-0 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forward";
   
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attraction Master"
        description="Manage packages, terminal access, and retrieve consumption history by terminal."
      />

      {/* FIX: Added 'w-full' to Tabs to ensure full width.
         Note: The default value determines which tab loads first. 
         Only 'package-listing' code will download initially.
      */}
      <Tabs defaultValue="package-listing" className="space-y-6 w-full">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
            
            <TabsTrigger value="package-listing" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10">
              <PackageIcon className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Package Listing
            </TabsTrigger>
            
            <TabsTrigger value="update-terminal" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Settings className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Update Terminal
            </TabsTrigger>
            
            <TabsTrigger value="consume-history-by-terminal" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <History className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Consume History
            </TabsTrigger>
            
            <TabsTrigger value="bcompare-package" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <DivideCircle className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> BCompare Package
            </TabsTrigger>

          </TabsList>
        </div>

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
  )
}