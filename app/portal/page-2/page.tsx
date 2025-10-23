import { PageHeader } from "@/components/portal/page-header"
import { EmptyState } from "@/components/portal/empty-state"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

export default function Page2() {
  return (
    <div>
      <PageHeader title="Page 2" description="This is a blank page ready for your custom features">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </PageHeader>

      <Card className="p-8">
        <EmptyState
          icon={<FileText className="h-12 w-12" />}
          title="No content yet"
          description="This page is ready to add features and functionality. Start building something amazing!"
          action={{
            label: "Get Started",
            href: "/portal/page-2/get-started",
          }}
        />
      </Card>
    </div>
  )
}
