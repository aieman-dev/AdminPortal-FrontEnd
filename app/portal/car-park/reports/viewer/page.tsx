"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Maximize2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PageHeader } from "@/components/portal/page-header" // 1. Reusing PageHeader
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb" // 2. Reusing Breadcrumbs
import { CAR_PARK_REPORTS } from "@/config/reports"

export default function ReportViewerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const reportCode = searchParams.get('report');
    
    const reportDef = CAR_PARK_REPORTS.find(r => r.code === reportCode);

    // --- CONFIGURATION ---
    const REPORT_SERVER_BASE = "https://your-report-server-url/ReportServer"; 
    
    const reportUrl = reportDef 
        ? `${REPORT_SERVER_BASE}?${reportDef.path}&rs:Embed=true&rc:Parameters=true`
        : "";

    if (!reportDef) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
                <h3 className="text-lg font-bold">Report Not Found</h3>
                <Button onClick={() => router.back()} variant="outline">Return to List</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-[calc(100vh-80px)] w-full max-w-[1600px] mx-auto p-6">
            
            {/* 1. Standard Breadcrumbs */}
            <div className="flex-shrink-0 mb-2">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <span className="text-muted-foreground">Car Park</span>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink href="/portal/car-park/reports">Reports Center</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{reportDef.name}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            {/* 2. Reused PageHeader (Handles Title & Actions consistent with other pages) */}
            <div className="flex-shrink-0">
                <PageHeader 
                    title={reportDef.name} 
                    description={`Report Code: ${reportDef.code}`}
                >
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(reportUrl, '_blank')}
                        className="gap-2"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Open New Tab
                    </Button>
                </PageHeader>
            </div>

            {/* 3. The Iframe Container (Fills remaining space) */}
            <Card className="flex-1 overflow-hidden border bg-white relative shadow-sm">
                <iframe 
                    src={reportUrl}
                    className="w-full h-full border-0"
                    title={reportDef.name}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                />
                
                {!reportUrl && (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-50/50">
                        <p>Report Server URL not configured.</p>
                    </div>
                )}
            </Card>
        </div>
    )
}