// app/portal/it-poswf/attraction-master/page.tsx
"use client"

import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { PackageIcon, Settings, History, DivideCircle } from "lucide-react"

// Import Extracted Tab Components
import PackageListingTab from "@/components/themepark-support/tabs/Attraction/PackageListingTab"
import UpdateTerminalTab from "@/components/themepark-support/tabs/Attraction/UpdateTerminalTab"
import ConsumeHistoryByTerminalTab from "@/components/themepark-support/tabs/Attraction/ConsumeHistoryByTerminalTab"
import BComparePackageTab from "@/components/themepark-support/tabs/Attraction/BComparePackageTab"

export default function AttractionMasterPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Attraction Master"
        description="Manage packages, terminal access, and retrieve consumption history by terminal."
      />

      <Tabs defaultValue="package-listing" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
            <TabsTrigger value="package-listing" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10">
              <PackageIcon className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Package Listing
            </TabsTrigger>
            <TabsTrigger value="update-terminal" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <Settings className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Update Terminal
            </TabsTrigger>
            <TabsTrigger value="consume-history-by-terminal" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <History className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Consume History by Terminal
            </TabsTrigger>
            <TabsTrigger value="bcompare-package" className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10">
              <DivideCircle className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> BCompare Package
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="package-listing" className="mt-0 space-y-6"><PackageListingTab /></TabsContent>
        <TabsContent value="update-terminal" className="mt-0 space-y-6"><UpdateTerminalTab /></TabsContent>
        <TabsContent value="consume-history-by-terminal" className="mt-0 space-y-6"><ConsumeHistoryByTerminalTab /></TabsContent>
        <TabsContent value="bcompare-package" className="mt-0 space-y-6"><BComparePackageTab /></TabsContent>
      </Tabs>
    </div>
  )
}