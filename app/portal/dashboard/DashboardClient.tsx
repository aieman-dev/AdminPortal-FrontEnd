// app/portal/dashboard/DashboardClient.tsx
"use client"

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/portal/page-header";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { formatCurrency } from "@/lib/formatter";
import { getDashboardRole } from "@/lib/auth";

// Config & Types
import { DASHBOARD_CONFIG, DashboardRole, MASTER_ACTIONS, MasterAction } from "@/config/dashboard";
import { useDashboard } from "@/context/DashboardContext"
import { ROLES } from "@/lib/constants";
import { Package } from "@/type/packages";
import { dashboardService } from "@/services/dashboard-service";

// Modular Components
import { StatCard } from "@/components/portal/stat-card";
import { PerformanceChart } from "@/components/modules/dashboard/PerformanceChart";
import { TopPackagesCard } from "@/components/modules/dashboard/TopPackagesCard";
import { PendingPackagesList } from "@/components/modules/dashboard/PendingPackagesList";
import { QuickAccess } from "@/components/modules/dashboard/QuickAccess";
import { KioskModal } from "@/components/modules/dashboard/KioskModal";
import { SystemDiagnostics } from "@/components/portal/system-diagnostics";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface DashboardClientProps {
  initialPendingPackages: Package[]; 
}

export default function DashboardClient({ initialPendingPackages }: DashboardClientProps) {
  const { user } = useAuth();
  const viewMode = getDashboardRole(user?.department);
  const roleConfig = viewMode ? DASHBOARD_CONFIG[viewMode] : undefined;
  
  //GENERATE PERMITTED ACTIONS
  const permittedActions = useMemo(() => {
      if (!user?.department) return [];
      return MASTER_ACTIONS.filter(action => action.isVisible(user.department));
  }, [user]);


  // State & Context
  const { summary, kioskData, refreshKiosks, isLoading } = useDashboard()
  const [pendingPackages] = useState<Package[]>(initialPendingPackages);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  
  const [filter, setFilter] = useState("ThisWeek");
  const [isKioskOpen, setIsKioskOpen] = useState(false);

  const [systemStatus, setSystemStatus] = useState("Checking...");
  const [systemLatency, setSystemLatency] = useState("");

  // --Check System Health (Simulating SystemDiagnostics) ---
  useEffect(() => {
    const checkSystemHealth = async () => {
        try {
            const start = performance.now();
            await dashboardService.getSummary("ThisWeek");
            const latency = Math.round(performance.now() - start);
            
            setSystemStatus("200"); 
            setSystemLatency(`Response Time: ${latency}ms`);
        } catch (error) {
            console.error("System Health Check Failed:", error);
            const errCode = (error as any)?.statusCode || "500";
            setSystemStatus(String(errCode));
            setSystemStatus("Service Unavailable");
        }
    };
    checkSystemHealth();
    
    // Optional: Poll every 30 seconds for live status
    const interval = setInterval(checkSystemHealth, 3600000);
    return () => clearInterval(interval);
  }, []);


  useEffect(() => {
    const fetchUnsynced = async () => {
      if (viewMode === ROLES.MIS_SUPER || viewMode === ROLES.IT_ADMIN) {
        try {
          const count = await dashboardService.getUnsyncedCount();
          setUnsyncedCount(count);
        } catch (error) {
          console.error("Failed to load unsynced packages:", error);
        }
      }
    };

    if (viewMode) {
        fetchUnsynced();
    }
  }, [viewMode]);

  if (!roleConfig) return (
    <div className="h-[60vh] flex items-center justify-center">
        <EmptyState icon={ShieldAlert} title="Access Denied" description="Role not configured." />
    </div>
  );

  const getStatValue = (id: string) => {
    if (isLoading && !summary && id !== "kiosk_status" && id !== "package_sync") return "...";
    switch(id) {
        case "revenue": return formatCurrency(summary?.salesAmount || 0);
        case "kiosk_status": {
             if (kioskData.length === 0) return "0 / 0";
             const activeCount = kioskData.filter(k => k.isActive).length;
             return `${activeCount} / ${kioskData.length}`;
        }
        case "pending_pkgs": return (summary?.pendingPackages ?? pendingPackages.length).toString();
        case "active_terminals": return `${summary?.activeTerminals || 0} / ${summary?.totalTerminals || 0}`;
        case "sales_count": return (summary?.salesCount || 0).toString();
        case "consumption": return (summary?.ticketConsumption || 0).toString();
        case "drafts": return (summary?.draftPackages || 0).toString();
        case "package_sync": return unsyncedCount.toString();
        case "avg_trx": return formatCurrency((summary?.salesCount || 0) > 0 ? (summary?.salesAmount || 0) / summary!.salesCount : 0);
        case "system_health": return systemStatus;
        default: return "0";
    }
  };

  const StatCardItem = ({ stat, value, description }: { stat: any, value: string, description: string }) => {
    let finalColor = stat.color;
    let finalDesc = description;
    
    if (stat.id === "system_health") {
        finalColor = systemStatus.startsWith("200") ? "text-green-600" : "text-red-600";
        finalDesc = systemLatency;
    }
    if (stat.id === "kiosk_status") {
        const down = kioskData.filter((k: any) => !k.isActive).length;
        finalColor = down > 0 ? "text-red-600" : "text-green-600";
    }
    if (finalColor === "default") finalColor = undefined; 

    return (
      <StatCard 
          title={stat.label} 
          value={value} 
          description={description}
          icon={stat.icon} 
          valueColor={finalColor} 
          trend={stat.trend ? { value: "Live", positive: true } : undefined} 
          onClick={stat.id === "kiosk_status" ? () => setIsKioskOpen(true) : undefined}
      />
    );
  };

  // Helper to check if a widget should be shown
  const showWidget = (key: string) => roleConfig?.widgets?.includes(key as any);

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title={`Hello, ${user?.name?.split(' ')[0]}`} description="Dashboard Overview" />

        {/* Stats Grid */}
        <div className="hidden md:grid grid-cols-4 gap-4">
            {roleConfig.stats.map(stat => (
                <StatCardItem 
                    key={stat.id} 
                    stat={stat} 
                    value={getStatValue(stat.id)} 
                    description={stat.id === "package_sync" ? "Synced" : ""}
                />
            ))}
        </div>

        <div className="md:hidden -mx-6 px-6">
             <Carousel className="w-full">
                <CarouselContent>
                    {roleConfig.stats.map(stat => (
                        <CarouselItem key={stat.id} className="basis-[85%] pl-4">
                            <StatCardItem 
                                stat={stat} 
                                value={getStatValue(stat.id)} 
                                description={stat.id === "package_sync" ? "Synced" : ""}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
             </Carousel>
        </div>

        {/* --- DYNAMIC WIDGET LAYOUT --- */}
        <div className="grid gap-6 md:grid-cols-7 items-start">
            <div className="col-span-7 lg:col-span-4 flex flex-col gap-6">
                {showWidget('performance_chart') && (
                    <PerformanceChart 
                        data={summary?.weeklySalesChart || []} 
                        loading={isLoading} 
                        filter={filter} 
                        onFilterChange={setFilter} 
                    />
                )}
                {showWidget('top_packages') && (
                    <TopPackagesCard data={summary?.bestSellingPackages || []} loading={isLoading} />
                )}

                {showWidget('system_diagnostics') && (
                    <div className="mt-2">
                        <SystemDiagnostics autoRun={true} />
                    </div>
                )}
            </div>
            
            <div className="col-span-7 lg:col-span-3 flex flex-col gap-6 h-full">
                {showWidget('pending_list') && (
                    <PendingPackagesList data={pendingPackages} count={summary?.pendingPackages} />
                )}

                <QuickAccess availableActions={permittedActions} />
            </div>
        </div>

        <KioskModal 
            isOpen={isKioskOpen} 
            onClose={() => setIsKioskOpen(false)} 
            data={kioskData} 
            onRefresh={refreshKiosks}
        />
    </motion.div>
  )
}