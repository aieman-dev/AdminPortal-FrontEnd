import { serverFetch } from "@/lib/server-api";
import { getContent } from "@/lib/api-client";
import  DashboardClient  from "@/app/portal/dashboard/DashboardClient"
import { Package } from "@/type/packages";
import { ROLES } from "@/lib/constants";
import { getServerUserRole } from "@/lib/server-auth";
import { ModuleErrorBoundary } from "@/components/portal/module-error-boundary";
import { cookies } from "next/headers";
import { logger } from "@/lib/logger";

export default async function DashboardPage() {
  const userRole = await getServerUserRole();
  const canViewPackages = userRole !== ROLES.IT_ADMIN;

  let pendingPackages: Package[] = [];

  const cookieStore = await cookies();
  const hasToken = cookieStore.has("accessToken");

  // Conditional Fetching
  if (canViewPackages && hasToken) {
    try {
      const payload = {
        Status: "Pending",
        PageNumber: 1,
        PageSize: 5,
        SearchQuery: "",
        StartDate: null,
        EndDate: null ,
        PackageType: null 
      };

      const response = await serverFetch<any>("packageView/search", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
     if (response) {
          pendingPackages = getContent<Package>(response);
      }
        
    } catch (error) {
      logger.warn("Dashboard Package Load Warning:", { error });
    }
  } 

  return (
    <ModuleErrorBoundary>
      <DashboardClient initialPendingPackages={pendingPackages} />
    </ModuleErrorBoundary>
  )
}