"use client"

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PackageX, Package as PackageIcon, ArrowRight } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { getRelativeTime } from "@/lib/formatter";
import { Package } from "@/type/packages";

interface Props {
    data: Package[];
    count?: number;
}

export function PendingPackagesList({ data, count }: Props) {
    const router = useRouter();
    const displayCount = count ?? data.length;

    return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Pending Approval</CardTitle>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                        {displayCount} Pending
                    </Badge>
                </div>
                <CardDescription>Recently submitted packages awaiting review.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                {data.length === 0 ? (
                    <div className="py-4">
                        <EmptyState icon={PackageX} title="All caught up!" description="No pending packages found." />
                    </div>
                ) : (
                    data.map((pkg) => (
                        <div 
                            key={pkg.id} 
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" 
                            onClick={() => router.push(`/portal/packages/pdetails/requests/${pkg.id}`)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <PackageIcon size={16} />
                                </div>
                                <div className="space-y-0.5">
                                    <div className="text-sm font-medium truncate max-w-[150px]">{pkg.name}</div>
                                    <div className="text-xs text-muted-foreground">
                                        by {pkg.submittedBy || "Unknown"} • {getRelativeTime(pkg.createdDate)}
                                    </div>
                                </div>
                            </div>
                            <ArrowRight size={16} className="text-muted-foreground" />
                        </div>
                    ))
                )}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-xs" 
                    onClick={() => router.push('/portal/packages?filter=Pending')}
                >
                    View All Pending
                </Button>
            </CardContent>
        </Card>
    );
}