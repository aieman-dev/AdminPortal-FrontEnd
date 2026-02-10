//app/portal/DashboardClient.tsx
"use client"

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/portal/page-header";
import { ShieldAlert, TabletSmartphone } from "lucide-react";
import { EmptyState } from "@/components/portal/empty-state";
import { useAppToast } from "@/hooks/use-app-toast";
import { formatCurrency } from "@/lib/formatter";

// Config & Types
import { DASHBOARD_CONFIG, DashboardRole } from "@/config/dashboard";
import { ROLES } from "@/lib/constants";
import { DashboardSummary, KioskStatus } from "@/type/dashboard";
import { Package } from "@/type/packages";

// Services
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
  const toast = useAppToast();
  
  // State
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pendingPackages, setPendingPackages] = useState<Package[]>(initialPendingPackages);
  const [kioskData, setKioskData] = useState<KioskStatus[]>([]);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ThisWeek");
  const [isKioskOpen, setIsKioskOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState("Checking...");

  // Role Config
  const viewMode = user?.department ? (
      user.department.toUpperCase().includes("MIS") ? ROLES.MIS_SUPER :
      user.department.toUpperCase().includes("FINANCE") ? ROLES.FINANCE :
      user.department.toUpperCase().includes("TP") ? ROLES.TP_ADMIN :
      user.department.toUpperCase().includes("IT") ? ROLES.IT_ADMIN : undefined
  ) as DashboardRole : undefined;
  
  const roleConfig = viewMode ? DASHBOARD_CONFIG[viewMode] : undefined;

  // 1. Define the lightweight Kiosk fetcher
  const fetchKioskHeartbeat = useCallback(async () => {
    if (!roleConfig?.stats.some(s => s.id === 'kiosk_status')) return;

    try {
        const kiosks = await dashboardService.getKioskStatus();
        setKioskData(kiosks); 
    } catch (e) {
        console.error("Kiosk heartbeat failed", e);
    }
  }, [roleConfig]);

  // Unified Data Fetching
  useEffect(() => {
    if (!roleConfig) { setLoading(false); return; }

    const loadFullDashboard = async () => {
        setLoading(true);
        try {
            // Run all primary data fetches in parallel so slow pings don't block fast ones
            const [summaryData, recentPkgs, unsynced, initialKiosks] = await Promise.all([
                dashboardService.getSummary(filter),
                viewMode !== ROLES.IT_ADMIN ? dashboardService.getRecentPendingPackages() : Promise.resolve([]),
                roleConfig.stats.some(s => s.id === 'package_sync') ? dashboardService.getUnsyncedCount() : Promise.resolve(0),
                roleConfig.stats.some(s => s.id === 'kiosk_status') ? dashboardService.getKioskStatus() : Promise.resolve([])
            ]);

            setSummary(summaryData);
            setPendingPackages(recentPkgs);
            setUnsyncedCount(unsynced);
            setKioskData(initialKiosks); 
            setSystemStatus("200 OK");
        } catch (e) {
            console.error(e);
            setSystemStatus("Connection Failed");
            toast.error("Dashboard Error", "Failed to load latest data.");
        } finally {
            setLoading(false);
        }
    };

    loadFullDashboard();
}, [viewMode, roleConfig, filter]);

// Independent Interval for Kiosk (Runs every 30s)
  useEffect(() => {
      const intervalId = setInterval(() => {
          if (!document.hidden) {
              fetchKioskHeartbeat();
          }
      }, 30000);

      return () => clearInterval(intervalId);
  }, [fetchKioskHeartbeat]);

  if (!roleConfig) return 
  <div className="h-[60vh] flex items-center justify-center">
    <EmptyState 
    icon={ShieldAlert} 
    title="Access Denied" 
    description="Role not configured." />
    </div>;

    const refreshKiosks = async () => {
        try {
            const kiosks = await dashboardService.getKioskStatus();
            setKioskData(kiosks);
        } catch (e) {
            console.error("Failed to auto-refresh kiosks", e);
        }
    };

  // Helper for Stats Values
  const getStatValue = (id: string) => {
    if (loading && !summary && id !== "kiosk_status") return "...";
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
        case "system_load": return ((summary?.salesCount || 0) + (summary?.ticketConsumption || 0)).toLocaleString();
        case "avg_trx": return formatCurrency((summary?.salesCount || 0) > 0 ? (summary?.salesAmount || 0) / summary!.salesCount : 0);
        case "system_health": return systemStatus;
        default: return "0";
    }
  };

  // --- RESTORED: STAT CARD ITEM LOGIC ---
  const StatCardItem = ({ stat, value, description, systemStatus, kioskData, setIsKioskOpen 
}: { stat: any, value: string, description: string, systemStatus: string, kioskData: any[], setIsKioskOpen: (val: boolean) => void }) => {
    let finalColor = stat.color;
    let finalDescription = description;
    
    if (stat.id === "system_health") {
        finalColor = systemStatus.startsWith("200") ? "text-green-600" : "text-red-600";
    }
    if (stat.id === "kiosk_status") {
        const down = kioskData.filter((k: any) => !k.isActive).length;
        finalColor = down > 0 ? "text-red-600" : "text-green-600";
        finalDescription = down > 0 ? `${down} kiosks offline` : "All systems normal";
    }

    if (finalColor === "default") finalColor = undefined; 

    return (
      <StatCard 
          title={stat.label} 
          value={value} 
          description={finalDescription}
          icon={stat.icon} 
          valueColor={finalColor} 
          trend={stat.trend ? { value: "Live", positive: true } : undefined} 
          onClick={stat.id === "kiosk_status" ? () => setIsKioskOpen(true) : undefined}
      />
    );
};

  return (
    <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <PageHeader title={`Hello, ${user?.name?.split(' ')[0]}`} description="Dashboard Overview" />

        {/* Stats Grid (Desktop) */}
        <div className="hidden md:grid grid-cols-4 gap-4">
            {roleConfig.stats.map(stat => (
                <StatCardItem 
                        key={stat.id} 
                        stat={stat} 
                        value={getStatValue(stat.id)} 
                        description={stat.id === "package_sync" ? (unsyncedCount > 0 ? `${unsyncedCount} unsynced` : "All Synced") : ""}
                        systemStatus={systemStatus}
                        kioskData={kioskData}
                        setIsKioskOpen={setIsKioskOpen}
                    />
            ))}
        </div>

        {/* Stats Carousel (Mobile) */}
        <div className="md:hidden -mx-6 px-6">
             <Carousel className="w-full">
                <CarouselContent>
                    {roleConfig.stats.map(stat => (
                        <CarouselItem key={stat.id} className="basis-[85%] pl-4">
                            {/* Pass all required props exactly like the desktop grid */}
                            <StatCardItem 
                                stat={stat} 
                                value={getStatValue(stat.id)} 
                                description={stat.id === "package_sync" ? (unsyncedCount > 0 ? `${unsyncedCount} unsynced` : "All Synced") : ""}
                                systemStatus={systemStatus}
                                kioskData={kioskData}
                                setIsKioskOpen={setIsKioskOpen}
                            />
                        </CarouselItem>
                    ))}
                </CarouselContent>
             </Carousel>
        </div>

        {/* Main Content Area */}
        <div className="grid gap-6 md:grid-cols-7 items-start">
            <div className="col-span-7 lg:col-span-4 flex flex-col gap-6">
                <PerformanceChart 
                    data={summary?.weeklySalesChart || []} 
                    loading={loading} 
                    filter={filter} 
                    onFilterChange={setFilter} 
                />
                <TopPackagesCard data={summary?.bestSellingPackages || []} />
                {viewMode === ROLES.MIS_SUPER && (
                    <div className="mt-2">
                        <SystemDiagnostics autoRun={true} />
                    </div>
                )}
            </div>
            
            <div className="col-span-7 lg:col-span-3 flex flex-col gap-6 h-full">
                <PendingPackagesList data={pendingPackages} count={summary?.pendingPackages} />
                <QuickAccess actions={roleConfig.quickActions} />
            </div>
        </div>

        <KioskModal 
            isOpen={isKioskOpen} 
            onClose={() => setIsKioskOpen(false)} 
            data={kioskData} 
            onRefresh={fetchKioskHeartbeat}
            />
    </motion.div>
  )
}