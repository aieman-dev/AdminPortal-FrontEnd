import { serverFetch } from "@/lib/server-api";
import DashboardClient from "./DashboardClient";
import { Package } from "@/type/packages";
import { ROLES } from "@/lib/constants";
import { getServerUserRole } from "@/lib/server-auth";
import { ModuleErrorBoundary } from "@/components/portal/module-error-boundary";

export default async function DashboardPage() {
  //  Get the role safely
  const userRole = await getServerUserRole();

  //  Define Logic: Who is ALLOWED to see packages?
  const canViewPackages = userRole !== ROLES.IT_ADMIN;

  let pendingPackages: Package[] = [];

  // Conditional Fetching
  if (canViewPackages) {
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
      
      // FIX: Handle the nested response structure: { content: { content: [...] } }
      if (response) {
          if (response?.content?.content && Array.isArray(response.content.content)) {
              pendingPackages = response.content.content;
          } else if (response?.content && Array.isArray(response.content)) {
              pendingPackages = response.content;
          } else if (Array.isArray(response)) {
              pendingPackages = response;
          }
      }
        
    } catch (error) {
      console.warn("Dashboard Package Load Warning:", error);
    }
  } 

  return (
    <ModuleErrorBoundary>
      <DashboardClient initialPendingPackages={pendingPackages} />;
    </ModuleErrorBoundary>
  )
}