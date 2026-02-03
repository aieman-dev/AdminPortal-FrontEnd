"use client"
//import { useState } from "react"
//import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/portal/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Ban, ShieldCheck } from "lucide-react"
import { LoaderState } from "@/components/ui/loader-state"
import dynamic from "next/dynamic"

// Lazy load tabs for performance
const BlacklistTab = dynamic(() => import("@/components/modules/car-park/tabs/BlacklistTab"), {
    loading: () => <LoaderState message="Loading blacklist..." className="h-[300px]" />
})
const WhitelistTab = dynamic(() => import("@/components/modules/car-park/tabs/WhitelistTab"), {
    loading: () => <LoaderState message="Loading whitelist..." className="h-[300px]" />
})

//const [shouldCrash, setShouldCrash] = useState(false);

// This will trigger the Error Boundary because the error happens during the RENDER
//if (shouldCrash) {
//  throw new Error("Module Level Crash Test");
//}

export default function AccessControlPage() {
    const tabTransitionClass = "mt-0 space-y-6 outline-none animate-in fade-in slide-in-from-bottom-5 duration-500 fill-mode-forward";

    return (
        <div className="space-y-6">
        {/* uncomment for error
        <Button 
        variant="destructive" 
        onClick={() => setShouldCrash(true)}
        >
        Test Render Crash
        </Button>
    */}
            <PageHeader 
                title="Access Control" 
                description="Manage blocked users (Blacklist) and exempted users (Whitelist)." 
            />

            <Tabs defaultValue="blacklist" className="space-y-6 w-full">
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                    <TabsList className="inline-flex h-auto p-0 bg-transparent border-b w-full md:w-auto min-w-full md:min-w-0 justify-start rounded-none">
                        
                        <TabsTrigger 
                            value="blacklist" 
                            className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-4 py-2.5 text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px relative z-10"
                        >
                            <Ban className="mr-2 h-4 w-4 text-red-500" /> 
                            Blocked Listing
                        </TabsTrigger>
                        
                        <TabsTrigger 
                            value="whitelist" 
                            className="rounded-t-lg rounded-b-none border border-b-0 border-border bg-muted/50 px-4 py-2.5 text-sm whitespace-nowrap data-[state=active]:bg-card data-[state=active]:border-b-card data-[state=active]:shadow-sm -mb-px -ml-px relative z-10"
                        >
                            <ShieldCheck className="mr-2 h-4 w-4 text-green-600" /> 
                            Whitelist
                        </TabsTrigger>

                    </TabsList>
                </div>

                

                <TabsContent value="blacklist" className={tabTransitionClass}>
                    <BlacklistTab />
                </TabsContent>

                <TabsContent value="whitelist" className={tabTransitionClass}>
                    <WhitelistTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}