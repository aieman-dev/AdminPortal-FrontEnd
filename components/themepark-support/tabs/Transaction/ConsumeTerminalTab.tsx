// components/it-poswf/tabs/Transaction/ConsumeTerminalTab.tsx
"use client"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Settings } from "lucide-react"

export default function ConsumeTerminalTab() {
    // This is a placeholder for the "Consume Terminal" tab content
    return (
        <Card>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Settings className="h-10 w-10 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Consume Terminal Management</h3>
                    <p className="text-sm text-center max-w-lg">
                        This tab will be used to manage terminals specifically configured for consumption processes.
                        Implementation for this feature is pending.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}