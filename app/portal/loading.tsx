import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Header Skeleton */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" /> {/* Title */}
          <Skeleton className="h-4 w-96" /> {/* Subtitle */}
        </div>
      </div>

      {/* 2. Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" /> {/* Label */}
                <Skeleton className="h-8 w-16" /> {/* Value */}
              </div>
              <Skeleton className="h-12 w-12 rounded-lg" /> {/* Icon */}
            </div>
          </Card>
        ))}
      </div>

      {/* 3. Main Content Grid Skeleton */}
      <div className="grid gap-6 md:grid-cols-7 items-start">
        
        {/* Left Column (Charts) */}
        <div className="col-span-7 lg:col-span-4 flex flex-col gap-6">
          {/* Performance Chart Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40 mb-2" />
              <Skeleton className="h-4 w-60" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full rounded-md" />
            </CardContent>
          </Card>
          
          {/* Top Packages Skeleton */}
          <Card>
            <CardHeader className="flex flex-row justify-between">
               <Skeleton className="h-6 w-48" />
               <Skeleton className="h-5 w-20 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-4">
               {Array.from({ length: 3 }).map((_, i) => (
                 <div key={i} className="flex justify-between items-center">
                    <div className="flex gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-20" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-16" />
                 </div>
               ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (Lists/Alerts) */}
        <div className="col-span-7 lg:col-span-3 flex flex-col gap-6">
           {/* Pending Packages Skeleton */}
           <Card>
              <CardHeader className="flex flex-row justify-between">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-20 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg" />
                  ))}
                  <Skeleton className="h-9 w-full mt-2" />
              </CardContent>
           </Card>

           {/* System Alerts Skeleton */}
           <Card>
              <CardHeader>
                  <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex gap-3">
                          <Skeleton className="h-2 w-2 rounded-full mt-2" />
                          <div className="space-y-1 flex-1">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-12" />
                          </div>
                      </div>
                  ))}
              </CardContent>
           </Card>
        </div>

      </div>
    </div>
  )
}