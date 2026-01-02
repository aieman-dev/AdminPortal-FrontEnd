"use client"

import { useState, useEffect } from "react";
import { DASHBOARD_CONFIG, DashboardRole } from "@/config/dashboard";
import { 
    Ticket, ShoppingCart, Activity,  
    ArrowRight, Package as PackageIcon, CheckCircle2, Wallet, Users,
    FileText, PlusCircle, Monitor,
    Clock, BarChart3, Trophy,TrendingUp, 
    Server, ShieldAlert, Network, PackageX,
    Settings, ClipboardList, Database, RefreshCw, Zap
} from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
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

interface DashboardClientProps {
  initialPendingPackages: Package[]; 
}

export default function DashboardClient({ initialPendingPackages }: DashboardClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  
  const [pendingPackages] = useState<Package[]>(initialPendingPackages);
  const [summary, setSummary] = useState<DashboardSummaryDTO | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState<number>(0); // NEW: For IT/MIS
  const [loading, setLoading] = useState(true);

  // --- ROLE LOGIC ---
  const getRoleView = (dept: string | undefined) => {
      if (!dept) return "BUSINESS";
      const d = dept.toUpperCase();
      if (d.includes("MIS")) return "SUPER"; 
      if (d.includes("FINANCE")) return "FINANCE";
      if (d.includes("TP")) return "TP";
      if (d.includes("IT")) return "IT"; 
      return ; 
  };
  
  const viewMode = getRoleView(user?.department);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchDashboardData = async () => {
        try {
            // 1. Fetch Basic Summary (Fast, DB Optimized)
            const summaryData = await packageService.getDashboardSummary();
            setSummary(summaryData);

            // 2. Fetch Unsynced Count (Only for MIS or IT)
            // We only need this extra DB call if the user cares about Sync Status
            if (viewMode === "SUPER" || viewMode === "IT") {
                const unsyncedData = await packageService.getUnsyncedPackages();
                if (unsyncedData.success && Array.isArray(unsyncedData.data)) {
                    setUnsyncedCount(unsyncedData.data.length);
                }
            }

        } catch (error) {
            console.error("Failed to load dashboard stats", error);
        } finally {
            setLoading(false);
        }
    };
    fetchDashboardData();
  }, [viewMode]);

  // --- DERIVED METRICS ---
  // We calculate these on the fly from the Summary DTO
  const chartData = summary?.weeklySalesChart.map(item => ({
      name: item.dayName.substring(0, 3), 
      sales: item.totalAmount,
      consume: 0 
  })) || [];

  const topPackages = summary?.bestSellingPackages || [];
  
  // Base Variables
  const totalRevenue = summary?.salesAmount || 0;
  const salesCount = summary?.salesCount || 0;
  const consumeCount = summary?.consumeCount || 0; // Assuming this exists or using ticketConsumption
  const ticketConsumption = summary?.ticketConsumption || 0;
  
  const pendingCount = summary?.pendingPackages ?? pendingPackages.length;
  const draftCount = summary?.draftPackages || 0;
  
  const activeTerminals = summary?.activeTerminals || 0;
  const totalTerminals = summary?.totalTerminals || 0;

  // Calculated Variables
  const avgTransactionValue = salesCount > 0 ? totalRevenue / salesCount : 0;
  const totalSystemLoad = salesCount + ticketConsumption; // Total interactions processed
  const syncStatusLabel = unsyncedCount > 0 ? "Pending Sync" : "Synced";
  const syncStatusColor = unsyncedCount > 0 ? "text-orange-600" : "text-green-600";

  // --- ANIMATION HELPERS ---
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

  // --- DYNAMIC STATS CONFIGURATION ---
  const renderStats = () => {
      let items = [];
      
      switch (viewMode) {
        case "IT": // IT Department
            items = [
                // 1. Unsynced Items (Database Integrity)
                <StatCard 
                    key="it-1" 
                    title="Unsynced Items" 
                    value={unsyncedCount.toString()} 
                    description="Packages pending sync" 
                    icon={RefreshCw} 
                    valueColor={unsyncedCount > 0 ? "text-orange-600" : "text-green-600"} 
                />,
                // 2. Active Terminals (Hardware Status)
                <StatCard 
                    key="it-2" 
                    title="Active Terminals" 
                    value={`${activeTerminals} / ${totalTerminals}`} 
                    description="Online / Total Provisioned" 
                    icon={Server} 
                    valueColor="text-blue-600" 
                />,
                // 3. System Load (Throughput)
                <StatCard 
                    key="it-3" 
                    title="System Load" 
                    value={totalSystemLoad.toLocaleString()} 
                    description="Total transactions today" 
                    icon={Activity} 
                />,
                // 4. Draft Configs (Work in Progress)
                <StatCard 
                    key="it-4" 
                    title="Draft Configs" 
                    value={draftCount.toString()} 
                    description="Packages in draft state" 
                    icon={FileText} 
                    valueColor="text-slate-500" 
                />
            ];
            break;

        case "FINANCE": // Finance Department
            items = [
                // 1. Revenue (Cash Flow)
                <StatCard 
                    key="fin-1" 
                    title="Total Revenue" 
                    value={formatCurrency(totalRevenue)} 
                    description="Sales processed today" 
                    icon={ShoppingCart} 
                />,
                // 2. Approvals (Action Items)
                <StatCard 
                    key="fin-2" 
                    title="Pending Approval" 
                    value={pendingCount.toString()} 
                    description="Packages awaiting review" 
                    icon={Clock} 
                    valueColor="text-orange-600" 
                />,
                // 3. Sales Volume (Activity) - Replaces Void
                <StatCard 
                    key="fin-3" 
                    title="Sales Count" 
                    value={salesCount.toString()} 
                    description="Transactions completed" 
                    icon={Ticket} 
                />,
                // 4. Avg Ticket Size (Performance)
                <StatCard 
                    key="fin-4" 
                    title="Avg. Transaction" 
                    value={formatCurrency(avgTransactionValue)} 
                    description="Revenue per sale" 
                    icon={TrendingUp} 
                    valueColor="text-emerald-600" 
                />
            ];
            break;

        case "TP": // Theme Park Operations
            items = [
                // 1. Consumption (Crowd Control)
                <StatCard 
                    key="tp-1" 
                    title="Today's Consumption" 
                    value={ticketConsumption.toString()} 
                    description="Tickets redeemed today" 
                    icon={Users} 
                    valueColor="text-indigo-600"
                />,
                // 2. Pending Packages (Replaced Active Gates)
                <StatCard 
                    key="tp-2" 
                    title="Pending Packages" 
                    value={pendingCount.toString()} 
                    description="Awaiting Finance approval" 
                    icon={Clock} 
                    valueColor="text-orange-600" 
                />,
                // 3. Tickets Sold (Demand) - Replaces Peak Hours
                <StatCard 
                    key="tp-3" 
                    title="Tickets Sold" 
                    value={salesCount.toString()} 
                    description="New tickets issued today" 
                    icon={Ticket} 
                />,
                // 4. Drafts (Marketing Plans)
                <StatCard 
                    key="tp-4" 
                    title="Draft Packages" 
                    value={draftCount.toString()} 
                    description="Promos being created" 
                    icon={FileText} 
                    valueColor="text-slate-500" 
                />
            ];
            break;

        case "SUPER": // MIS / Superadmin
        default:
            items = [
                // 1. Revenue (Business Health)
                <StatCard 
                    key="mis-1" 
                    title="Total Revenue" 
                    value={formatCurrency(totalRevenue)} 
                    description="Sales processed today" 
                    icon={ShoppingCart} 
                    trend={{ value: "Live", positive: true }} 
                />,
                // 2. Pending Packages
                <StatCard 
                    key="mis-4" 
                    title="Pending Packages" 
                    value={pendingCount.toString()} 
                    description="Awaiting review" 
                    icon={Clock} 
                    valueColor="text-orange-600" 
                />,
                // 3. Active Terminals (Infrastructure)
                <StatCard 
                    key="mis-3" 
                    title="Active Terminals" 
                    value={`${activeTerminals} / ${totalTerminals}`} 
                    description="Network connectivity" 
                    icon={Monitor} 
                    valueColor="text-blue-600" 
                />,
                // 4. DB Sync (System Health) - Replaces Staff Activity
                <StatCard 
                    key="mis-2" 
                    title="DB Sync Status" 
                    value={syncStatusLabel} 
                    description={`${unsyncedCount} items pending`} 
                    icon={Database} 
                    valueColor={syncStatusColor} 
                />
            ];
            break;
      }

      return items.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
            {item}
        </motion.div>
      ));
  }

  // --- SUB-COMPONENTS (Chart & Lists) ---
  // (These remain mostly the same, just keeping them clean)

  const PerformanceChart = () => (
    <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>Weekly Sales Revenue</CardDescription>
        </CardHeader>
        <CardContent className="pl-0">
            <div className="h-[300px] w-full">
                {loading ? (
                <LoaderState message="Loading chart data..." className="h-full border-none bg-transparent" />
            ) : chartData.length === 0 || chartData.every(d => d.sales === 0) ? (
                <div className="h-full flex items-center justify-center">
                    <EmptyState 
                        icon={BarChart3} 
                        title="No data available" 
                        description="Sales trends will appear here once transactions occur." 
                    />
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `RM${value/1000}k`} />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                    return (
                                        <div className="bg-popover border border-border p-3 rounded-lg shadow-xl text-sm">
                                            <p className="font-semibold mb-2">{label}</p>
                                            <p className="text-primary">Sales: {formatCurrency(payload[0].value as number)}</p>
                                        </div>
                                    )
                                }
                                return null;
                            }}
                        />
                        <Bar animationDuration={1500} dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
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
                    {pendingCount} Pending
                </Badge>
            </div>
            <CardDescription>Recently submitted packages awaiting review.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
            {pendingPackages.length === 0 ? (
                <div className="py-4">
                    <EmptyState 
                        icon={PackageX} 
                        title="All caught up!" 
                        description="No pending packages found." 
                    />
                </div>
            ) : (
                pendingPackages.map((pkg) => (
                <div 
                        key={pkg.id} 
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" 
                        onClick={() => router.push(`/portal/packages/pdetails/requests/${pkg.id}`)}
                    >
                        <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <PackageIcon size={16} />
                        </div>
                        <div className="space-y-0.5">
                                <div className="text-sm font-medium truncate max-w-[150px]">{pkg.name}</div>
                                <div className="text-xs text-muted-foreground">
                                    by {pkg.submittedBy || "Unknown"} • {getRelativeTime(pkg.createdDate)}
                                </div>
                            </div>
                    </div>
                    <ArrowRight size={16} className="text-muted-foreground" />
                </div>
                ))
            )}
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => router.push('/portal/packages?filter=Pending')}>
                View All Pending
            </Button>
        </CardContent>
    </Card>
  );

  const TopPackagesCard = () => (
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
            ) : topPackages.length === 0 ? (
                <div className="h-full flex items-center justify-center py-4">
                    <EmptyState 
                        icon={Trophy} 
                        title="No top performers" 
                        description="Sales ranking data is currently unavailable." 
                    />
                </div>
                ) : (
                    topPackages.map((pkg, idx) => (
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

  // --- QUICK ACTION BUTTONS ---
  const getQuickActionButtons = () => {
        if (viewMode === "SUPER") {
            return [
               { label: "Global Config", icon: Settings, path: "/portal/settings/global", color: "text-orange-600" },
               { label: "Create Pkg", icon: PlusCircle, path: "/portal/packages/form", color: "text-indigo-600" },
               { label: "User Mgmt", icon: Users, path: "/portal/staff-management", color: "text-blue-500" },
               { label: "System Logs", icon: ShieldAlert, path: "/portal/setting", color: "text-red-500" },
               { label: "Audit Trail", icon: ClipboardList, path: "/portal/audit-trail", color: "text-teal-600" },
               { label: "Backup Data", icon: Database, path: "/portal/system/backup", color: "text-violet-600" },
            ]
        }
        
        return [
           { label: "Create Pkg", icon: PlusCircle, path: "/portal/packages/form", color: "text-indigo-600" },
           { label: "Manual Consume", icon: Wallet, path: "/portal/themepark-support/ticket-master", color: "text-green-600" },
           { label: "View Packages", icon: Ticket, path: "/portal/packages", color: "text-blue-500" },
           { label: "Terminals", icon: Monitor, path: "/portal/themepark-support/attraction-master", color: "text-slate-500" },
        ]
  };

  const QuickAccess = () => {
        const buttons = getQuickActionButtons();
        return (
          <Card className="hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Access</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                  {buttons.map((btn, idx) => (
                      <motion.div key={idx} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                              variant="outline" 
                              className="w-full h-auto py-3 flex flex-col gap-2 items-center justify-center hover:border-primary/50 hover:bg-primary/5 transition-all" 
                              onClick={() => router.push(btn.path)}
                          >
                              <btn.icon className={`h-5 w-5 ${btn.color}`} />
                              <span className="text-xs font-normal">{btn.label}</span>
                          </Button>
                      </motion.div>
                  ))}
              </CardContent>
          </Card>
        );
  };

  // --- MAIN RENDER ---
  return (
    <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="show"
    >
      <motion.div variants={itemVariants}>
          <PageHeader 
            title={`Hello, ${user?.name?.split(' ')[0] || 'User'}`} 
            description="Dashboard Overview" 
          />
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStats()}
      </div>

      <div className="grid gap-6 md:grid-cols-7 items-start">
        {viewMode === "SUPER" ? (
            <>
                <motion.div variants={itemVariants} className="col-span-7 lg:col-span-4 flex flex-col gap-6">
                    <PerformanceChart />
                    <TopPackagesCard />
                </motion.div>
                
                <motion.div variants={itemVariants} className="col-span-7 lg:col-span-3 flex flex-col gap-6 justify-between h-full">
                    <PendingPackagesList />
                    <QuickAccess />
                </motion.div>
            </>
        ) : (
            <>
                <motion.div variants={itemVariants} className="col-span-7 lg:col-span-4 flex flex-col gap-6">
                    <PerformanceChart />
                    <TopPackagesCard />
                </motion.div>
                <motion.div variants={itemVariants} className="col-span-7 lg:col-span-3 flex flex-col gap-6">
                    <QuickAccess />
                    <PendingPackagesList />
                </motion.div>
            </>
        )}
      </div>
    </motion.div>
  )
}