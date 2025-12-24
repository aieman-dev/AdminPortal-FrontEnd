"use client"

import { PageHeader } from "@/components/portal/page-header"
import { StatCard } from "@/components/portal/stat-card"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
    Ticket, ShoppingCart, Activity,  
    ArrowRight, Package as PackageIcon, XCircle, CheckCircle2, Wallet, Users,
    FileText, PlusCircle, AlertTriangle, Monitor,
    Clock, BarChart3, History, Trophy, TrendingUp,
    ScrollText, Server, RefreshCw, ShieldCheck
} from "lucide-react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { motion, useSpring, useTransform } from "framer-motion" // Ensure hooks are imported
import { useEffect, useState } from "react"
import { packageService } from "@/services/package-services"
import { Package } from "@/type/packages"
import { getRelativeTime } from "@/lib/formatter"

// --- NEW HELPER COMPONENT FOR BADGES ---
function AnimatedCounter({ value, prefix = "", suffix = "" }: { value: number, prefix?: string, suffix?: string }) {
    const spring = useSpring(0, { bounce: 0, duration: 1500 });
    const display = useTransform(spring, (current) => `${prefix}${Math.round(current)}${suffix}`);
    
    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    return <motion.span>{display}</motion.span>;
}

// --- ANIMATION VARIANTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
}
const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
}

// --- MOCK DATA ---
const chartData = [
  { name: "Mon", sales: 4000, consume: 2400 },
  { name: "Tue", sales: 3000, consume: 1398 },
  { name: "Wed", sales: 2000, consume: 9800 },
  { name: "Thu", sales: 2780, consume: 3908 },
  { name: "Fri", sales: 1890, consume: 4800 },
  { name: "Sat", sales: 2390, consume: 3800 },
  { name: "Sun", sales: 3490, consume: 4300 },
]


const systemActivities = [
    { id: 1, action: "System Alert", detail: "Terminal T-105 went offline", time: "45 mins ago", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-100" },
    { id: 2, action: "Transaction Voided", detail: "Trx #99281 voided by MIS_Super", time: "2 hours ago", icon: XCircle, color: "text-orange-600", bg: "bg-orange-100" },
    { id: 3, action: "New Login", detail: "User 'TP_Admin' logged in from new IP", time: "5 hours ago", icon: Users, color: "text-blue-600", bg: "bg-blue-100" },
    { id: 4, action: "Database Backup", detail: "Daily backup completed successfully", time: "8 hours ago", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
    { id: 5, action: "Package Sync", detail: "Synced 'WaterWorld' to 42 terminals", time: "10 hours ago", icon: RefreshCw, color: "text-indigo-600", bg: "bg-indigo-100" },
    { id: 6, action: "Security Check", detail: "Automated vulnerability scan passed", time: "12 hours ago", icon: ShieldCheck, color: "text-teal-600", bg: "bg-teal-100" },
]

const topPackages = [
    { id: 1, name: "WaterWorld Weekend", sold: 450, revenue: "RM 22,500", trend: "+12%" },
    { id: 2, name: "Family Super Saver", sold: 320, revenue: "RM 18,200", trend: "+5%" },
    { id: 3, name: "Couple Night Out", sold: 180, revenue: "RM 9,800", trend: "+8%" },
    { id: 4, name: "Student Holiday Pass", sold: 120, revenue: "RM 4,200", trend: "-2%" },
]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-3 rounded-lg shadow-xl outline-none">
        <p className="font-semibold text-foreground mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.fill }}/>
            <span className="text-muted-foreground capitalize">{entry.name}:</span>
            <span className="font-mono font-medium text-foreground">
                {entry.name === "Sales" ? `RM ${entry.value}` : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const getRoleView = (dept: string | undefined) => {
    if (!dept) return "TECH"; 
    const d = dept.toUpperCase();
    if (d.includes("FINANCE")) return "FINANCE";
    if (d.includes("TP")) return "TP";
    return "TECH"; 
}

const getRoleDescription = (mode: string) => {
    switch(mode) {
        case "FINANCE": return "Analytics, Revenue Monitoring, and Approval Management.";
        case "TP": return "Operations Overview, Package Creation, and Terminal Monitoring.";
        default: return "System Diagnostics, User Management, and Technical Support.";
    }
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const viewMode = getRoleView(user?.department);
  const descriptionText = getRoleDescription(viewMode);

  const [pendingPackages, setPendingPackages] = useState<Package[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);

  // FETCH PENDING PACKAGES ON MOUNT
  useEffect(() => {
      const fetchPending = async () => {
          try {
              // Reusing existing service: getPackages(status, startDate, endDate, page...)
              // We want 'Pending' status, Page 1, maybe top 5 items
              const { packages } = await packageService.getPackages("Pending", undefined, undefined, 1);
              
              // Slice to show only top 3-5 on dashboard
              setPendingPackages(packages.slice(0, 5));
          } catch (error) {
              console.error("Failed to fetch pending packages for dashboard", error);
          } finally {
              setLoadingPending(false);
          }
      };

      fetchPending();
  }, []);

  const renderStats = () => {
    const pendingCount = loadingPending ? 0 : pendingPackages.length;
      let items = [];
      if(viewMode === "FINANCE") {
          items = [
            <StatCard key="1" title="Total Revenue" value="RM 45,231" description="Sales processed today" icon={ShoppingCart} trend={{ value: "8%", positive: true }} />,
            <StatCard key="2" title="Packages Pending" value={pendingCount.toString()} description="Waiting for your approval" icon={Clock} valueColor="text-orange-600" />,
            <StatCard key="3" title="Void Requests" value="12" description="Transactions voided today" icon={XCircle} valueColor="text-red-600" />,
            <StatCard key="4" title="Active Packages" value="145" description="Live in system" icon={Ticket} />
          ];
      } else if (viewMode === "TP") {
          items = [
            <StatCard key="1" title="Today's Consumption" value="1,284" description="Tickets redeemed today" icon={Ticket} trend={{ value: "12%", positive: true }} />,
            <StatCard key="2" title="Pending Review" value="3" description="Waiting on Finance" icon={Clock} valueColor="text-orange-600" />,
            <StatCard key="3" title="Active Terminals" value="42 / 45" description="Terminals online" icon={Monitor} valueColor="text-green-600" />,
            <StatCard key="4" title="Draft Packages" value="5" description="Work in progress" icon={FileText} valueColor="text-blue-600" />
          ];
      } else { // TECH
          items = [
            <StatCard key="1" title="Total Revenue" value="RM 45,231" description="Daily system revenue" icon={ShoppingCart} />,
            <StatCard key="2" title="Active Terminals" value="42 / 45" description="3 terminals offline" icon={Activity} valueColor="text-green-600" />,
            <StatCard key="3" title="Pending Packages" value={pendingCount.toString()} description="Workflow bottlenecks" icon={Clock} valueColor="text-orange-600" />,
            <StatCard key="4" title="System Health" value="98%" description="All services operational" icon={Monitor} valueColor="text-green-600" />
          ];
      }

      return items.map((item, idx) => (
        <motion.div key={idx} variants={itemVariants}>
            {item}
        </motion.div>
      ));
  }

  const getQuickActionButtons = () => {
      if (viewMode === "FINANCE") {
          return [
             { label: "Approve Pkg", icon: CheckCircle2, path: "/portal/packages?filter=Pending", color: "text-orange-600" },
             { label: "Account Search", icon: Users, path: "/portal/themepark-support/account-master", color: "text-purple-500" },
             { label: "Sales Report", icon: BarChart3, path: "/portal/packages", color: "text-blue-500" },
             { label: "Active Pkgs", icon: Ticket, path: "/portal/packages", color: "text-indigo-500" },
          ]
      } else if (viewMode === "TP") {
          return [
             { label: "Create Pkg", icon: PlusCircle, path: "/portal/packages/form", color: "text-indigo-600" },
             { label: "Manual Consume", icon: Wallet, path: "/portal/themepark-support/ticket-master", color: "text-green-600" },
             { label: "View Packages", icon: Ticket, path: "/portal/packages", color: "text-blue-500" },
             { label: "Terminals", icon: Monitor, path: "/portal/themepark-support/attraction-master", color: "text-slate-500" },
          ]
      } else { // TECH
          return [
             { label: "Deactivate Tkt", icon: XCircle, path: "/portal/themepark-support/ticket-master", color: "text-red-500" },
             { label: "Extend Tkt", icon: Activity, path: "/portal/themepark-support/ticket-master", color: "text-blue-500" },
             { label: "Account", icon: Users, path: "/portal/themepark-support/account-master", color: "text-purple-500" },
             { label: "Create Pkg", icon: PlusCircle, path: "/portal/packages/form", color: "text-indigo-600" },
             { label: "Terminals", icon: Server, path: "/portal/themepark-support/attraction-master", color: "text-slate-500" },
             { label: "Transactions", icon: ScrollText, path: "/portal/themepark-support/transaction-master", color: "text-orange-500" },
          ]
      }
  }

  const renderBottomWidget = () => {
    const isTech = viewMode === "TECH";
    const title = isTech ? "Recent System Activity" : "Top Performing Packages";
    const Icon = isTech ? History : Trophy; 
    const iconColor = isTech ? "text-muted-foreground" : "text-yellow-500";

    return (
        <Card className="flex flex-col flex-1 h-full hover:shadow-md transition-shadow duration-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                        <CardTitle className="text-base">{title}</CardTitle>
                    </div>
                    {!isTech && <Badge variant="outline" className="text-xs font-normal">This Week</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-1">
                <div className="space-y-4">
                    {isTech ? (
                        systemActivities.map((item) => (
                            <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                                <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                                    <item.icon size={14} />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium leading-none">{item.action}</p>
                                    <p className="text-xs text-muted-foreground">{item.detail}</p>
                                </div>
                                <div className="ml-auto text-xs text-muted-foreground tabular-nums">
                                    {item.time}
                                </div>
                            </div>
                        ))
                    ) : (
                        topPackages.map((pkg, idx) => (
                            <div key={pkg.id} className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                        {idx + 1}
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium leading-none">{pkg.name}</p>
                                        <p className="text-xs text-muted-foreground">{pkg.sold} sold</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold">{pkg.revenue}</p>
                                    <div className="flex items-center justify-end gap-1 text-[10px] text-green-600">
                                        <TrendingUp size={10} /> {pkg.trend}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
  }

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
            description={descriptionText} 
          />
      </motion.div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {renderStats()}
      </div>

      <div className="grid gap-6 md:grid-cols-7 items-stretch">
        
        {/* LEFT COLUMN */}
        <motion.div variants={itemVariants} className="col-span-7 lg:col-span-4 flex flex-col gap-6">
            <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                    <CardTitle>Performance Overview</CardTitle>
                    <CardDescription>Sales vs. Consumption (Last 7 Days)</CardDescription>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `RM${value/1000}k`} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                                <Bar animationDuration={1500} dataKey="sales" name="Sales" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                <Bar animationDuration={1500} dataKey="consume" name="Consumption" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            <Card className="flex flex-col flex-1 h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {viewMode === "TECH" ? <History className="h-5 w-5 text-muted-foreground" /> : <Trophy className="h-5 w-5 text-yellow-500" />}
                            <CardTitle className="text-base">{viewMode === "TECH" ? "Recent System Activity" : "Top Performing Packages"}</CardTitle>
                        </div>
                        {viewMode !== "TECH" && <Badge variant="outline" className="text-xs font-normal">This Week</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="flex-1">
                    <div className="space-y-4">
                        {viewMode === "TECH" ? (
                            systemActivities.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 pb-3 border-b last:border-0 last:pb-0">
                                    <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${item.bg} ${item.color}`}>
                                        <item.icon size={14} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-sm font-medium leading-none">{item.action}</p>
                                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                                    </div>
                                    <div className="ml-auto text-xs text-muted-foreground tabular-nums">
                                        {item.time}
                                    </div>
                                </div>
                            ))
                        ) : (
                            topPackages.map((pkg, idx) => (
                                <div key={pkg.id} className="flex items-center justify-between pb-3 border-b last:border-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-sm font-medium leading-none">{pkg.name}</p>
                                            <p className="text-xs text-muted-foreground">{pkg.sold} sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{pkg.revenue}</p>
                                        <div className="flex items-center justify-end gap-1 text-[10px] text-green-600">
                                            <TrendingUp size={10} /> {pkg.trend}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </motion.div>

        {/* RIGHT COLUMN */}
        <motion.div variants={itemVariants} className="col-span-7 lg:col-span-3 flex flex-col gap-6">
            <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Pending Packages</CardTitle>
                        {/*  ANIMATED BADGE HERE  */}
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 hover:bg-orange-100">
                             <AnimatedCounter value={pendingPackages.length} suffix=" Pending" />
                        </Badge>
                    </div>
                    <CardDescription>Recently submitted packages awaiting review.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4">
                    {loadingPending ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">Loading pending items...</div>
                    ) : pendingPackages.length === 0 ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">No pending packages found.</div>
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

            <Card className="flex flex-col flex-1 h-full hover:shadow-md transition-shadow duration-200">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">Quick Access</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3 flex-1">
                    {getQuickActionButtons().map((btn, idx) => (
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

        </motion.div>
      </div>
    </motion.div>
  )
}