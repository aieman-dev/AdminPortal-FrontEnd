// components/it-poswf/tabs/Attraction/BComparePackageTab.tsx
"use client"
import { Card, CardContent } from "@/components/ui/card"
import { DivideCircle } from "lucide-react"

export default function BComparePackageTab() {
    // This is a placeholder for the "BCompare Package" tab content
    return (
        <Card>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <DivideCircle className="h-10 w-10 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">BCompare Package Tool</h3>
                    <p className="text-sm text-center max-w-lg">
                        This tool will allow side-by-side comparison of package configurations.
                        Implementation for this feature is pending.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}