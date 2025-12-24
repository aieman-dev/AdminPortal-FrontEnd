// app/portal/page.tsx
import { serverFetch } from "@/lib/server-api";
import DashboardClient from "./DashboardClient";
import { Package } from "@/type/packages";

export default async function DashboardPage() {
  // 1. Fetch data ON THE SERVER (Zero latency for the user)
  // Note: Adjust the endpoint to match your backend exactly
  const packageResponse = await serverFetch<Package[]>("packageView/search?Status=Pending&PageNumber=1&PageSize=5");
  
  // Handle case where backend returns wrapped data { data: [...] }
  // Adjust this based on your actual API response structure
  const pendingPackages = Array.isArray(packageResponse) ? packageResponse : (packageResponse as any)?.data || [];

  // 2. Pass data to the Client Component
  return <DashboardClient initialPendingPackages={pendingPackages} />;
}