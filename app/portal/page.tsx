import { serverFetch } from "@/lib/server-api";
import DashboardClient from "./DashboardClient";
import { Package } from "@/type/packages";
import { ROLES } from "@/lib/constants";
import { getServerUserRole } from "@/lib/server-auth";

export default async function DashboardPage() {
  // 1. Get the role safely using our new utility
  const userRole = await getServerUserRole();

  // 2. Define Logic: Who is ALLOWED to see packages?
  // Only MIS, TP, and Finance can view packages. IT_ADMIN cannot.
  const canViewPackages = userRole !== ROLES.IT_ADMIN;

  let pendingPackages: Package[] = [];

  // 3. Conditional Fetching
  // If user is IT Admin, this block is SKIPPED. No API call = No 403 Error.
  if (canViewPackages) {
    try {
      const packageResponse = await serverFetch<Package[]>("packageView/search", {
        method: "POST",
        body: JSON.stringify({
          Status: "Pending",
          PageNumber: 1,
          PageSize: 5
        })
      });
      
      pendingPackages = Array.isArray(packageResponse) 
        ? packageResponse 
        : (packageResponse as any)?.data || [];
        
    } catch (error) {
      console.error("Failed to load dashboard packages:", error);
    }
  } 

  // 4. Pass data to your EXISTING DashboardClient
  // IT Admins receive [], so their dashboard renders without the package section.
  return <DashboardClient initialPendingPackages={pendingPackages} />;
}