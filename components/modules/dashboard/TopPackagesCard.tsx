"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { LoaderState } from "@/components/ui/loader-state";
import { formatCurrency } from "@/lib/formatter";
import { BestSellingPackage } from "@/type/dashboard"; // Ensure this type exists or use any

interface Props {
    data: BestSellingPackage[];
    loading?: boolean;
}

export function TopPackagesCard({ data, loading = false }: Props) {
    return (
        <Card className="flex flex-col hover:shadow-md transition-shadow duration-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle className="text-base">Top Performing Packages</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs font-normal">This Week</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loading ? (
                        <LoaderState message="Loading best sellers..." className="py-12 h-auto border-none bg-transparent" />
                    ) : data.length === 0 ? (
                        <div className="h-full flex items-center justify-center py-4">
                            <EmptyState icon={Trophy} title="No top performers" description="Sales ranking data is currently unavailable." />
                        </div>
                    ) : (
                        data.map((pkg, idx) => (
                            <div key={idx} className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {idx + 1}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium leading-none">{pkg.packageName}</p>
                                        <p className="text-xs text-muted-foreground">{pkg.totalSold} sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{formatCurrency(pkg.totalRevenue)}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}