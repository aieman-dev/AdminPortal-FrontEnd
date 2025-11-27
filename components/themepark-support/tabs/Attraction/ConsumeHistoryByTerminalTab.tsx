// components/it-poswf/tabs/Attraction/ConsumeHistoryByTerminalTab.tsx
"use client"
import { Card, CardContent } from "@/components/ui/card"
import { History } from "lucide-react"

export default function ConsumeHistoryByTerminalTab() {
    // This is a placeholder for the "Consume History by Terminal" tab content
    return (
        <Card>
            <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <History className="h-10 w-10 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Consume History by Terminal</h3>
                    <p className="text-sm text-center max-w-lg">
                        This tab will provide detailed reports on all consumptions performed via specific terminals.
                        Implementation for this feature is pending.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}