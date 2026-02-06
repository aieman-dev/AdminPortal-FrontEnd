"use client"

import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Ticket, CreditCard, Plus } from "lucide-react"
import { LoaderState } from "@/components/ui/loader-state"
import dynamic from "next/dynamic"

// Dynamic Imports for modularity (Like AccountMasterPage)
const SeasonPassTab = dynamic(
  () => import("@/components/modules/hr/tabs/SeasonPassTab"), 
  { loading: () => <LoaderState message="Loading season pass data..." className="h-[300px]" /> }
)
const SuperAppVisitorTab = dynamic(
  () => import("@/components/modules/hr/tabs/SuperAppVisitor"), 
  { loading: () => <LoaderState message="Loading visitor data..." className="h-[300px]" /> }
)

export default function StaffParkingListPage() {
  const router = useRouter()
  const tabTransitionClass = "mt-0 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forward";
  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Parking List"
        description="Manage staff season passes and SuperApp visitor accounts in one place."
      >
        <Button 
            className="h-9 bg-black hover:bg-zinc-800 text-white shadow-sm gap-2" 
            onClick={() => router.push("/portal/hr/new-staff-cp")}
        >
            <Plus className="h-4 w-4" /> New Registration
        </Button>
      </PageHeader>

      <Tabs defaultValue="season" className="space-y-6">
        <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
          <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
            
            <TabsTrigger 
                value="season" 
                className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative data-[state=active]:z-10"
            >
              <Ticket className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> Season Passes
            </TabsTrigger>
            
            <TabsTrigger 
                value="visitor" 
                className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-3 md:px-4 py-2 md:py-2.5 text-xs md:text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative data-[state=active]:z-10"
            >
              <CreditCard className="mr-1.5 md:mr-2 h-3.5 w-3.5 md:h-4 md:w-4" /> SuperApp Visitor
            </TabsTrigger>

          </TabsList>
        </div>

        <TabsContent value="season" className={tabTransitionClass}>
            <SeasonPassTab />
        </TabsContent>
        
        <TabsContent value="visitor" className={tabTransitionClass}>
            <SuperAppVisitorTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}