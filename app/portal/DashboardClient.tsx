"use client"

import { useState, useEffect } from "react";
import { 
    BarChart3, Package as PackageIcon, ArrowRight, PackageX,
    Trophy, ShieldAlert, WifiOff, RotateCcw
} from "lucide-react";
import { 
    Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, 
    Cell, Legend, LabelList 
} from "recharts";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion"; 
import { Package, DashboardSummaryDTO } from "@/type/packages"; 
import { getRelativeTime, formatCurrency } from "@/lib/formatter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/portal/page-header";
import { StatCard } from "@/components/portal/stat-card";
import { LoaderState } from "@/components/ui/loader-state";
import { EmptyState } from "@/components/portal/empty-state";
import { packageService } from "@/services/package-services"; 
import { DASHBOARD_CONFIG, DashboardRole } from "@/config/dashboard";
import { ROLES } from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { SystemOffline } from "@/components/portal/system-offline";
import { SystemDiagnostics } from "@/components/portal/system-diagnostics";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppToast } from "@/hooks/use-app-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface DashboardClientProps {
  initialPendingPackages: Package[]; 
}

export default function DashboardClient({ initialPendingPackages }: DashboardClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const toast = useAppToast();
  
  const [pendingPackages, setPendingPackages] = useState<Package[]>(initialPendingPackages);
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<string>("Checking...");
  const [loading, setLoading] = useState(true);
  
  const [dashboardFilter, setDashboardFilter] = useState("ThisWeek");
  const [visibleSeries, setVisibleSeries] = useState({ Actual: true, Forecast: true });

  // --- ROLE LOGIC ---
  const getRoleView = (dept: string | undefined): DashboardRole | undefined => {
      if (!dept) return undefined;
      const d = dept.toUpperCase();
      if (d.includes("MIS") || d.includes("SUPER")) return ROLES.MIS_SUPER; 
      if (d.includes("FINANCE")) return ROLES.FINANCE;
      if (d.includes("TP")) return ROLES.TP_ADMIN;
      if (d.includes("IT")) return ROLES.IT_ADMIN;
      return undefined; 
  };
  
  const viewMode = getRoleView(user?.department);
  const roleConfig = viewMode ? DASHBOARD_CONFIG[viewMode] : undefined;

  // --- FETCH DATA ---
  useEffect(() => {
    if (!roleConfig) {
        setLoading(false);
        return;
    }

    const fetchDashboardData = async () => {
        setLoading(true); 
        try {
            const response: any = await packageService.getDashboardSummary(dashboardFilter);
            const actualData = response.content ? response.content : response;
            
            console.log("Unwrapped Dashboard Data:", actualData); 
            setSummary(actualData);
            setSystemStatus("200 OK");

            if (viewMode !== ROLES.IT_ADMIN) {
                try {
                    const { packages } = await packageService.getPackages(
                        "Pending", undefined, undefined, 1, "", "All"
                    );
                    setPendingPackages(packages.slice(0, 8)); 
                } catch (pkgError) { console.error(pkgError); }
            }
            
            const needsSyncData = roleConfig.stats.some(s => s.id === 'unsynced' || s.id === 'package_sync');
            if (needsSyncData) {
                try {
                    const unsyncedData = await packageService.getUnsyncedPackages();
                    if (unsyncedData.success && Array.isArray(unsyncedData.data)) {
                        setUnsyncedCount(unsyncedData.data.length);
                    }
                } catch (e) { console.error(e); }
            }

        } catch (error) {
            console.error("Dashboard Error:", error);
            setSystemStatus("Connection Failed");
            toast.error("Connection Error", "Failed to load live dashboard data.");
        } finally {
            setLoading(false);
        }
    };
    fetchDashboardData();
  }, [viewMode, roleConfig, dashboardFilter]);

  // --- DERIVED METRICS ---
  const weeklySales = summary?.weeklySalesChart || [];
  
  const chartData = weeklySales.map((item : any) => ({
      name: item.dayName.substring(0, 3), 
      Actual: item.actualAmount || 0,
      Forecast: item.forecastAmount || 0,
      fullDate: new Date(item.date).toLocaleDateString(),
      isForecast: false
  }));

  const handleLegendClick = (e: any) => {
      const seriesName = e.dataKey as keyof typeof visibleSeries;
      setVisibleSeries(prev => ({ ...prev, [seriesName]: !prev[seriesName] }));
  };

  const topPackages = summary?.bestSellingPackages || [];
  
  const getStatValue = (id: string) => {
      if (loading && !summary) return "...";
      const s = summary;
      switch(id) {
          case "revenue": return formatCurrency(s?.salesAmount || 0);
          case "system_health": return systemStatus;
          case "active_terminals": return `${s?.activeTerminals || 0} / ${s?.totalTerminals || 0}`;
          case "pending_pkgs": return (s?.pendingPackages ?? pendingPackages.length).toString();
          case "consumption": return (s?.ticketConsumption || 0).toString();
          case "sales_count": return (s?.salesCount || 0).toString();
          case "avg_trx": return formatCurrency((s?.salesCount || 0) > 0 ? (s?.salesAmount || 0) / s!.salesCount : 0);
          case "system_load": return ((s?.salesCount || 0) + (s?.ticketConsumption || 0)).toLocaleString();
          case "drafts": return (s?.draftPackages || 0).toString();
          case "package_sync": return unsyncedCount.toString();
          default: return "0";
      }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  if (!roleConfig) {
      return (
        <div className="h-[60vh] flex flex-col items-center justify-center">
            <EmptyState icon={ShieldAlert} title="Access Restricted" description="Department not configured." />
        </div>
      );
  }

  // --- Sub-Components ---
  const StatCardItem = ({ stat }: { stat: any }) => {
      let finalColor = stat.color;
      if (stat.id === "package_sync") finalColor = unsyncedCount > 0 ? "text-orange-600" : "text-green-600";
      if (stat.id === "system_health") finalColor = systemStatus.startsWith("200") ? "text-green-600" : "text-red-600";

      return (
        <StatCard 
            title={stat.label} 
            value={getStatValue(stat.id)} 
            description={stat.id === "package_sync" ? (unsyncedCount > 0 ? `${unsyncedCount} unsynced` : "Synced") : ""} 
            icon={stat.icon} 
            valueColor={finalColor === "default" ? undefined : finalColor} 
            trend={stat.trend ? { value: "Live", positive: true } : undefined} 
        />
      );
  }

  // --- COMPONENT: PERFORMANCE CHART (With Embedded Filter) ---
  const PerformanceChart = () => (
    <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
            <div className="flex items-start justify-between">
                <div>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription className="mt-1">Weekly Sales Revenue</CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                    {!visibleSeries.Actual && !visibleSeries.Forecast && (
                        <Button variant="ghost" size="icon" onClick={() => setVisibleSeries({ Actual: true, Forecast: true })} className="h-9 w-9">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    )}
                    <Select value={dashboardFilter} onValueChange={setDashboardFilter} disabled={loading}>
                        <SelectTrigger className="w-[130px] h-9 text-xs">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ThisWeek">This Week</SelectItem>
                            <SelectItem value="NextWeek">Next Week</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pl-0">
            <div className="h-[300px] w-full">
                {loading && !summary ? (
                    <LoaderState message="Loading chart data..." className="h-full min-h-[300px] border-none bg-transparent" />
                ) : chartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <EmptyState icon={BarChart3} title="No data available" description="Sales trends will appear here." />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        {/* FIX: Increased left margin to 15 to prevent label clipping */}
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 15, bottom: 5 }}>
                            <defs>
                                <pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                    <rect width="4" height="8" transform="translate(0,0)" fill="#9333EA" opacity="0.3" />
                                </pattern>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                            
                            {/* Y-Axis Config */}
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false} 
                                tickFormatter={(value) => `RM${value >= 1000 ? (value/1000).toFixed(1) + 'k' : value}`} 
                            />
                            
                            <Tooltip 
                                cursor={{ fill: 'rgba(0,0,0,0.05)' }} 
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const activeItem = payload.find(p => p.value > 0) || payload[0];
                                        const data = activeItem.payload;
                                        const isForecastBar = activeItem.dataKey === "Forecast";
                                        
                                        return (
                                            <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
                                                <div className="flex items-center justify-between gap-4 mb-1">
                                                    <span className="font-semibold">{label}</span>
                                                    {isForecastBar && (
                                                        <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-purple-200 text-purple-700 bg-purple-50">Forecast</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-2">{data.fullDate}</p>
                                                <p className="text-primary font-bold text-base">{formatCurrency(activeItem.value as number)}</p>
                                            </div>
                                        )
                                    }
                                    return null;
                                }}
                            />
                            
                            <Legend 
                                verticalAlign="top" height={36} iconType="circle" onClick={handleLegendClick}
                                formatter={(value) => {
                                    const isVisible = visibleSeries[value as keyof typeof visibleSeries];
                                    return <span className={`text-sm font-medium ml-1 ${!isVisible ? "text-muted-foreground opacity-50 decoration-slate-400 line-through" : "text-foreground"}`}>{value}</span>
                                }}
                            />

                            {/* Actual Bar - Added minPointSize={2} */}
                            <Bar 
                                dataKey="Actual" 
                                fill="#4F46E5" 
                                radius={[4, 4, 4, 4]} 
                                hide={!visibleSeries.Actual} 
                                animationDuration={1000} 
                                barSize={40}
                                minPointSize={2} // <--- Makes tiny values visible
                            >
                                <LabelList dataKey="Actual" position="top" className="fill-foreground font-bold text-[10px]" formatter={(val: any) => val > 0 ? `RM${val}` : ''} />
                            </Bar>

                            {/* Forecast Bar - Added minPointSize={2} */}
                            <Bar 
                                dataKey="Forecast" 
                                fill="url(#stripe-pattern)" 
                                radius={[4, 4, 4, 4]}
                                hide={!visibleSeries.Forecast} 
                                animationDuration={1000} 
                                barSize={40}
                                minPointSize={2} // <--- Makes tiny values visible
                            >
                                <LabelList dataKey="Forecast" position="top" className="fill-muted-foreground font-medium text-[10px]" formatter={(val: any) => val > 0 ? `RM${Number(val).toFixed(0)}` : ''} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </CardContent>
    </Card>
  );

  const PendingPackagesList = () => (
    <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
                <CardTitle className="text-base">Pending Packages</CardTitle>
                <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                    {summary?.pendingPackages ?? pendingPackages.length} Pending
                </Badge>
            </div>
            <CardDescription>Recently submitted packages awaiting review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {pendingPackages.length === 0 ? (
                <div className="py-4"><EmptyState icon={PackageX} title="All caught up!" description="No pending packages found." /></div>
            ) : (
                pendingPackages.map((pkg) => (
                <div key={pkg.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/portal/packages/pdetails/requests/${pkg.id}`)}>
                    <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><PackageIcon size={16} /></div>
                        <div className="space-y-0.5">
                            <div className="text-sm font-medium truncate max-w-[150px]">{pkg.name}</div>
                            <div className="text-xs text-muted-foreground">by {pkg.submittedBy || "Unknown"} • {getRelativeTime(pkg.createdDate)}</div>
                        </div>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground" />
                </div>
                ))
            )}
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => router.push('/portal/packages?filter=Pending')}>View All Pending</Button>
        </CardContent>
    </Card>
  );

  const TopPackagesCard = () => (
    <Card className="flex flex-col hover:shadow-md transition-shadow duration-200">
        <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-yellow-500" /><CardTitle className="text-base">Top Performing Packages</CardTitle></div>
                <Badge variant="outline" className="text-xs font-normal">This Week</Badge>
            </div>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                {loading ? <LoaderState message="Loading best sellers..." className="py-12 h-auto border-none bg-transparent" /> : topPackages.length === 0 ? (
                    <div className="h-full flex items-center justify-center py-4"><EmptyState icon={Trophy} title="No top performers" description="Sales ranking data is currently unavailable." /></div>
                ) : (
                    topPackages.map((pkg, idx) => (
                        <div key={idx} className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">{idx + 1}</div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium leading-none">{pkg.packageName}</p>
                                    <p className="text-xs text-muted-foreground">{pkg.totalSold} sold</p>
                                </div>
                            </div>
                            <div className="text-right"><p className="text-sm font-semibold">{formatCurrency(pkg.totalRevenue)}</p></div>
                        </div>
                    ))
                )}
            </div>
        </CardContent>
    </Card>
  );

  const QuickAccess = () => {
      if (!roleConfig) return null;
      return (
        <Card className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-3"><CardTitle className="text-base">Quick Access</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
                {roleConfig.quickActions.map((btn, idx) => (
                    <motion.div key={idx} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                        <Button variant="outline" className="w-full h-auto py-3 flex flex-col gap-2 items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all" onClick={() => router.push(btn.path)}>
                            <btn.icon className={`h-5 w-5 ${btn.color}`} /><span className="text-xs font-normal">{btn.label}</span>
                        </Button>
                    </motion.div>
                ))}
            </CardContent>
        </Card>
      );
  };

  const desktopGridClass = roleConfig.stats.length === 5 
    ? "hidden md:grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-5" 
    : "hidden md:grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4";

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
      <motion.div variants={itemVariants}>
          <PageHeader title={`Hello, ${user?.name?.split(' ')[0] || 'User'}`} description="Dashboard Overview" />
      </motion.div>

      {/* === MOBILE STATS CAROUSEL === */}
      <div className="md:hidden -mx-6 px-6">
          <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent>
                  {roleConfig.stats.map((stat, idx) => (
                      <CarouselItem key={stat.id} className="basis-[85%] pl-4">
                          <StatCardItem stat={stat} />
                      </CarouselItem>
                  ))}
              </CarouselContent>
          </Carousel>
      </div>

      {/* === DESKTOP STATS GRID === */}
      {/* This uses the dynamic class to handle 4 vs 5 columns correctly */}
      <div className={desktopGridClass}>
        {roleConfig.stats.map((stat, idx) => (
            <motion.div key={stat.id} variants={itemVariants} className="relative hover:z-50 transition-all duration-200">
                <StatCardItem stat={stat} />
            </motion.div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7 items-start">
        <motion.div variants={itemVariants} className="col-span-7 lg:col-span-4 flex flex-col gap-6">
            <PerformanceChart />
            <TopPackagesCard />

            {/* ===ADD DIAGNOSTICS FOR MIS SUPERADMIN === */}
            {viewMode === ROLES.MIS_SUPER && (
                <div className="mt-2">
                    <SystemDiagnostics />
                </div>
            )}
        </motion.div>
        
        <motion.div variants={itemVariants} className="col-span-7 lg:col-span-3 flex flex-col gap-6 justify-between h-full">
            <PendingPackagesList />
            <QuickAccess />
        </motion.div>
      </div>
    </motion.div>
  )
}