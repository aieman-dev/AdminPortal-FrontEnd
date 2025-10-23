import { PageHeader } from "@/components/portal/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function TicketManagementLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Ticket Management"
        description="Unified ticket operations - manage QR passwords, consume tickets, resync transactions, and extend expiry"
      />

      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Card>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
