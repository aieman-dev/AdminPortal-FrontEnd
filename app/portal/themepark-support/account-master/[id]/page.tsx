// app/portal/it-poswf/account-management/[id]/page.tsx
"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AccountDetailsClient } from "@/app/portal/themepark-support/account-master/[id]/account-details-client"
import { Account } from "@/type/themepark-support"
import { itPoswfService } from "@/services/themepark-support" 
import { Skeleton } from "@/components/ui/skeleton"

// --- CUSTOM SKELETON LOADER ---
const AccountDetailSkeleton = () => (
  <div className="space-y-6 pb-20 animate-in fade-in duration-500">
      {/* 1. Header Breadcrumbs */}
      <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-40" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full lg:min-h-[calc(100vh-140px)]">
          
          {/* LEFT PANEL SKELETON */}
          <div className="lg:col-span-4 h-full flex flex-col gap-6">
              {/* Profile Card */}
              <Card>
                  <CardHeader className="pb-3 border-b bg-muted/10">
                      <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="flex justify-between">
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-4 w-32" />
                          </div>
                      ))}
                  </CardContent>
              </Card>

              {/* Actions Card */}
              <Card className="flex-1">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                      <Skeleton className="h-6 w-32" />
                  </CardHeader>
                  <CardContent className="pt-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {Array.from({ length: 6 }).map((_, i) => (
                              <Skeleton key={i} className="h-10 w-full rounded-md" />
                          ))}
                      </div>
                  </CardContent>
              </Card>
          </div>

          {/* RIGHT PANEL SKELETON */}
          <div className="lg:col-span-8 h-full">
              <Card className="h-full flex flex-col border-0 lg:border">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                      <Skeleton className="h-6 w-48" />
                  </CardHeader>
                  <CardContent className="flex-1 p-6 space-y-4">
                      {/* Table Header */}
                      <div className="flex justify-between mb-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-4 w-20" />
                      </div>
                      {/* Table Rows */}
                      {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex justify-between items-center py-2 border-b">
                               <Skeleton className="h-4 w-full" />
                          </div>
                      ))}
                  </CardContent>
              </Card>
          </div>
      </div>
  </div>
)

export default function AccountDetailsPage({ params: { id } }: { params: { id: string } }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAccount = async () => {
      const accId = id; 

      if (!accId) {
        setLoading(false);
        return;
      }
      
      const response = await itPoswfService.getAccountDetails(accId);

      if (response.success && response.data) {
        setAccount(response.data); 
      } else {
        console.error("Failed to load account details:", response.error);
        setAccount(null);
      }
      setLoading(false);
    };

    fetchAccount();
  }, [id]) 


  if (loading) {
    return <AccountDetailSkeleton />
  }

  if (!account) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Account not found for ID: {id}
          </CardContent>
        </Card>
      </div>
    )
  }

  return <AccountDetailsClient account={account} />
}