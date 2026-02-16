// app/portal/simulation-lab/page.tsx
"use client"

import { PageHeader } from "@/components/portal/page-header"
import { TransactionSimulator } from "@/components/modules/simulation/TransactionSimulator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export default function SimulationLabPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Operational Simulation Lab" 
        description="Safe environment to test transaction logic and preview impacts before committing."
      />

      <Alert className="bg-indigo-50 border-indigo-200 text-indigo-800">
        <Info className="h-4 w-4" />
        <AlertTitle>Sandbox Environment</AlertTitle>
        <AlertDescription>
          Actions performed here are <strong>simulated</strong>. No real data will be modified, and no money will be deducted.
        </AlertDescription>
      </Alert>

      {/* The Core Simulation Component */}
      <TransactionSimulator />
    </div>
  )
}